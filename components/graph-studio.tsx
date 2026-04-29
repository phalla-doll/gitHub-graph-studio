"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Download, Eraser, Github, Sparkles, LayoutGrid, Paintbrush, Play, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// The GitHub grid is 7 rows x 52 columns
const ROWS = 7;
const COLS = 52;
type Level = 0 | 1 | 2 | 3 | 4;
type Grid = Level[][];

const createEmptyGrid = (): Grid => Array(ROWS).fill(0).map(() => Array(COLS).fill(0));

// Templates
const templates: Record<string, () => Grid> = {
  heart: () => {
    const g = createEmptyGrid();
    // A simple heart in the middle
    const c = 26;
    g[1][c - 2] = 4; g[1][c - 1] = 4; g[1][c + 1] = 4; g[1][c + 2] = 4;
    g[2][c - 3] = 4; g[2][c - 2] = 3; g[2][c - 1] = 4; g[2][c] = 4; g[2][c + 1] = 4; g[2][c + 2] = 3; g[2][c + 3] = 4;
    g[3][c - 3] = 4; g[3][c - 2] = 4; g[3][c - 1] = 3; g[3][c] = 4; g[3][c + 1] = 3; g[3][c + 2] = 4; g[3][c + 3] = 4;
    g[4][c - 2] = 4; g[4][c - 1] = 4; g[4][c] = 4; g[4][c + 1] = 4; g[4][c + 2] = 4;
    g[5][c - 1] = 4; g[5][c] = 4; g[5][c + 1] = 4;
    g[6][c] = 4;
    return g;
  },
  wave: () => {
    const g = createEmptyGrid();
    for (let c = 0; c < COLS; c++) {
      const r = Math.floor((Math.sin(c / 3) + 1) * 2.5); // 0 to 5
      g[r][c] = 4;
      if (r < 6) g[r+1][c] = 2;
    }
    return g;
  },
  random: () => {
    const g = createEmptyGrid();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        g[r][c] = Math.floor(Math.random() * 5) as Level;
      }
    }
    return g;
  }
};

const getLevelColor = (level: Level) => {
  switch (level) {
    case 0: return "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800";
    case 1: return "bg-emerald-200 border-emerald-300 dark:border-emerald-800/10";
    case 2: return "bg-emerald-400 border-emerald-500 dark:border-emerald-700/20";
    case 3: return "bg-emerald-600 border-emerald-700 dark:border-emerald-600/30";
    case 4: return "bg-emerald-800 border-emerald-900 dark:border-emerald-500/40";
  }
};

export function GraphStudio() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [currentTool, setCurrentTool] = useState<"draw" | "erase">("draw");
  const [drawLevel, setDrawLevel] = useState<Level>(4);
  const [hoveredCell, setHoveredCell] = useState<{r: number, c: number} | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("github-graph-studio-grid");
    if (saved) {
      try { setGrid(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("github-graph-studio-grid", JSON.stringify(grid));
  }, [grid]);

  const updateCell = useCallback((r: number, c: number, applyTool = true) => {
    setGrid(prev => {
      const newGrid = [...prev];
      newGrid[r] = [...newGrid[r]];
      
      if (applyTool) { // Use current tool logic
        if (currentTool === "erase") {
           newGrid[r][c] = 0;
        } else {
           newGrid[r][c] = drawLevel;
        }
      } else {
        // Toggle behavior if just clicking
        if (prev[r][c] === 4) newGrid[r][c] = 0;
        else newGrid[r][c] = (prev[r][c] + 1) as Level;
      }
      return newGrid;
    });
  }, [currentTool, drawLevel]);

  const handleCellMouseDown = (r: number, c: number) => {
    setIsMouseDown(true);
    updateCell(r, c, true);
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    setHoveredCell({r, c});
    if (isMouseDown) {
      updateCell(r, c, true);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const clearGrid = () => setGrid(createEmptyGrid());
  
  const applyTemplate = (name: keyof typeof templates) => {
    setGrid(templates[name]());
    toast.success(`Applied ${name} template!`);
  };

  const generateNodeScript = () => {
    // Generate dates starting from exactly 1 year ago (start of year for standard alignment)
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    // Adjust to nearest previous Sunday to align grid
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const commitsData: {date: string, count: number}[] = [];
    
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const level = grid[r][c];
        if (level > 0) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + (c * 7) + r);
          
          const count = level === 1 ? 1 : level === 2 ? 3 : level === 3 ? 5 : 8;
          commitsData.push({
            date: date.toISOString().split('T')[0],
            count
          });
        }
      }
    }

    const scriptLines = [
      'import { execSync } from "node:child_process";',
      'import fs from "node:fs";',
      '',
      'type CommitCell = { date: string; count: number; };',
      '',
      'const commits: CommitCell[] = ' + JSON.stringify(commitsData, null, 2) + ';',
      '',
      'console.log("Generating commits...");',
      'for (const item of commits) {',
      '  for (let i = 0; i < item.count; i++) {',
      '    const content = `${item.date} - commit ${i + 1}`;',
      '    fs.writeFileSync("log.txt", content);',
      '    execSync("git add log.txt");',
      '    execSync(`git commit -m "graph visual: ${item.date} #${i + 1}"`, {',
      '      env: {',
      '        ...process.env,',
      '        GIT_AUTHOR_DATE: `${item.date}T12:00:00`,',
      '        GIT_COMMITTER_DATE: `${item.date}T12:00:00`,',
      '      },',
      '    });',
      '  }',
      '}',
      'console.log("Done! You can now run \\x1b[32mgit push\\x1b[0m");',
    ];
    return scriptLines.join('\\n');
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(generateNodeScript());
    toast.success("Script copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 gap-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between col-span-full pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">GitHub Graph Studio</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Design your contribution canvas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button />}>
                <Download className="w-4 h-4 mr-2" />
                Export Script
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Node.js Commit Script</DialogTitle>
                <DialogDescription>
                  Save this as script.ts. Ensure you are in an empty/throwaway repo. 
                  Run with \`bun script.ts\` or \`npx tsx script.ts\`.
                </DialogDescription>
              </DialogHeader>
              <Textarea 
                className="flex-1 font-mono text-sm resize-none bg-muted/50 p-4 min-h-[300px]"
                readOnly
                value={generateNodeScript()}
              />
              <div className="flex justify-end pt-4">
                <Button onClick={copyScript} className="w-full sm:w-auto">
                  <Copy className="w-4 h-4 mr-2" /> Copy to Clipboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6 flex flex-col">
          {/* Main Grid Area */}
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md">
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant={currentTool === "draw" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setCurrentTool("draw")}
                        className="h-8 px-2"
                      />
                    }>
                        <Paintbrush className="w-4 h-4 mr-2" /> Draw
                    </TooltipTrigger>
                    <TooltipContent>Draw Tool</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button 
                        variant={currentTool === "erase" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => setCurrentTool("erase")}
                        className="h-8 px-2"
                      />
                    }>
                        <Eraser className="w-4 h-4 mr-2" /> Erase
                    </TooltipTrigger>
                    <TooltipContent>Erase Tool</TooltipContent>
                  </Tooltip>
                  <div className="w-px bg-border mx-1" />
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button variant="ghost" size="sm" onClick={clearGrid} className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" />
                    }>
                        Clear All
                    </TooltipTrigger>
                    <TooltipContent>Clear Grid</TooltipContent>
                  </Tooltip>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0,1,2,3,4].map((level) => (
                      <button
                        key={level}
                        className={`w-4 h-4 rounded-[2px] border ${getLevelColor(level as Level)} ${drawLevel === level && currentTool === "draw" ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950' : ''}`}
                        onClick={() => {
                          setCurrentTool("draw");
                          setDrawLevel(level as Level);
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto pb-6">
              <div 
                className="inline-flex gap-1 p-2 border border-zinc-100 dark:border-zinc-800/50 rounded-xl bg-zinc-50 dark:bg-zinc-900/20"
                onMouseLeave={() => setHoveredCell(null)}
              >
                {Array.from({length: COLS}).map((_, c) => (
                  <div key={c} className="flex flex-col gap-1">
                    {Array.from({length: ROWS}).map((_, r) => (
                      <div
                        key={`${r}-${c}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCellMouseDown(r, c);
                        }}
                        onMouseEnter={() => handleCellMouseEnter(r, c)}
                        className={`
                          w-3 h-3 sm:w-4 sm:h-4 transition-colors duration-75 
                          border rounded-[2px] sm:rounded-sm
                          cursor-crosshair
                          ${getLevelColor(grid[r][c])}
                          hover:ring-1 hover:ring-black dark:hover:ring-white z-10
                        `}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground px-2">
                <div>Hovering: {hoveredCell ? `W${hoveredCell.c + 1} D${hoveredCell.r + 1}` : '-'}</div>
                <div>{grid.flat().filter(l => l > 0).length} active cells</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center"><Sparkles className="w-4 h-4 mr-2 text-primary" /> Inspiration</CardTitle>
                <CardDescription className="text-xs">Quickly start with pre-made templates</CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex flex-wrap gap-2 text-sm">
                 <Button variant="outline" size="sm" onClick={() => applyTemplate("heart")}>Heart</Button>
                 <Button variant="outline" size="sm" onClick={() => applyTemplate("wave")}>Wave</Button>
                 <Button variant="outline" size="sm" onClick={() => applyTemplate("random")}>Scatter</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm flex items-center"><LayoutGrid className="w-4 h-4 mr-2" /> Data Mapping</CardTitle>
                <CardDescription className="text-xs">How intensity maps to commit count</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getLevelColor(1)}`}/> Level 1</span> <span className="font-mono">1-2 msg</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getLevelColor(2)}`}/> Level 2</span> <span className="font-mono">3-4 msgs</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getLevelColor(3)}`}/> Level 3</span> <span className="font-mono">5-7 msgs</span></div>
                  <div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${getLevelColor(4)}`}/> Level 4</span> <span className="font-mono">8+ msgs</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>How it works</CardTitle>
              <CardDescription>From pixels to GitHub history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-xs">1</div>
                <div><span className="font-medium">Draw your design</span> on the 7x52 canvas. Use varying intensities to create depth.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-xs">2</div>
                <div><span className="font-medium">Export Script.</span> Generate a precise Node.js script.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-xs">3</div>
                <div><span className="font-medium">Run in empty repo.</span> The script generates historical commits altering the times automatically.</div>
              </div>
               <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-medium text-xs">4</div>
                <div><span className="font-medium">Push to GitHub!</span> Watch your profile graph change instantly.</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-500 p-4 rounded-xl text-sm border border-amber-200 dark:border-amber-900/50">
            <strong>Warning:</strong> Apply this script to a dedicated dummy repository. Avoid running in professional codebases. Once you push the repo, the commits will show on your profile unless you delete the repo!
          </div>
        </div>
      </div>
    </div>
  );
}
