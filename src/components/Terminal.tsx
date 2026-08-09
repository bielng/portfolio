import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

// ─── Content the terminal commands print ─────────────────────────────────
// Keep this in one place so updating your bio/projects/contact info only
// requires editing here, not hunting through render logic below.

const ABOUT_TEXT = `Aspiring Data Scientist & Cloud Engineer
Data Enthusiast | Refugee Tech Advocate
AI & Data Engineering Student at ITESO Universidad Jesuita de Guadalajara

Mission:
Making data work for humanity through Python, AWS, Power BI & open-source tools.
Empowering marginalized communities through digital skills, freelancing, and innovation.

Current Focus:
  - Data Analytics Projects & Real-time Dashboards
  - Generative AI, AWS Cloud & Advanced ML
  - Collaborative AI Projects & Community Impact

Community Impact:
  Digital Skills Trainer at Konexio, empowering refugee communities with
  technology skills. Advocate at Skills Without Borders, bridging the
  digital divide for marginalized groups.`;

const PROJECTS_TEXT = `1. Motor Vehicle Thefts Analysis (New Zealand)
   SQL database analysis identifying theft patterns and recovery trends
   Tools: SQL, Python, Data Visualization, Statistical Analysis
   github.com/bielng/motor-vehicle-thefts-analysis-in-new-zealand

2. Linear Regression Model Validation
   Computer pricing analysis with comprehensive model assumption checks
   Tools: Python, Statistics, Machine Learning
   github.com/bielng/model_assumption

3. Maven Music Customer Churn Analysis
   Predictive analysis revealing user engagement and churn insights
   Tools: Predictive Analytics, Churn Analysis, Business Insights
   github.com/bielng/Maven_Music_Customer_Churn_Analysis_Project

4. Movie Ratings Data Cleaning & EDA
   Comprehensive data preparation and exploratory analysis
   Tools: EDA, Data Cleaning, Python
   github.com/bielng/data_cleaning_and_EDA_prep_project

5. Data Cleaning & Transformation Pipeline
   End-to-end data preparation workflow demonstration
   Tools: Automation, ETL, Data Engineering
   github.com/bielng/Data-Cleaning-and-Transformation-Project

Type 'contact' to reach out about any of these.`;

const SKILLS_TEXT = `Programming:      Python, SQL, JavaScript, HTML/CSS
Data Science:     Pandas, NumPy, Scikit-Learn, Matplotlib, Seaborn
Business Intel:   Power BI, Excel, DAX
Cloud & DB:       AWS, MySQL, PostgreSQL
Currently learning: Generative AI, advanced AWS architecture, deep learning`;

const EXPERIENCE_TEXT = `Konexio — Digital Skills Trainer
December 2022 - January 2024 | Kakuma, Kenya

  - Led digital literacy training for 33+ refugee students
  - Designed curriculum on data analysis, transcription, web content
  - Facilitated job platform engagement (Upwork, Fiverr, Appen)
  - Provided one-on-one mentorship and portfolio development

Education
  ITESO Universidad Jesuita de Guadalajara
  B.S. in Data Science and Engineering (Expected May 2028)`;

const CONTACT_TEXT = `Email:     ngunartaban@gmail.com
LinkedIn:  linkedin.com/in/taban-ngunar-x217
GitHub:    github.com/bielng

Open to data-driven collaborations, freelance work, and community
impact projects. I'd love to hear from you — scroll down to the
contact form, or just email me directly.`;

const COMMANDS = [
  "help",
  "about",
  "projects",
  "skills",
  "experience",
  "contact",
  "clear",
  "ls",
  "pwd",
  "whoami",
  "date",
  "echo",
  "neofetch",
  "cowsay",
] as const;

const HELP_TEXT = `Available commands:
  about        learn about Taban's background
  projects     list featured data science projects
  skills       technical skills and tools
  experience   work history and education
  contact      how to reach out
  ls           list directory contents
  pwd          show current path
  whoami       display current user
  date         show current date and time
  echo [text]  print text back
  neofetch     system info card
  cowsay [msg] a talking cow says your message
  clear        clear the screen

Use ↑ / ↓ for command history, Tab to autocomplete.`;

interface OutputBlock {
  id: number;
  kind: "command" | "output";
  content: React.ReactNode;
}

let blockId = 0;

const WELCOME_BLOCKS: Omit<OutputBlock, "id">[] = [
  {
    kind: "output",
    content: (
      <div className='text-green-400 font-bold tracking-wider'>
        ▓▓▓ WELCOME TO THE MATRIX ▓▓▓
      </div>
    ),
  },
  {
    kind: "output",
    content: (
      <div className='text-green-500/70'>
        Data Scientist & Cloud Engineer · Refugee Tech Advocate
      </div>
    ),
  },
  {
    kind: "output",
    content: (
      <div className='text-green-600/50 mt-1'>
        Type <span className='text-cyan-400 font-bold'>help</span> to see
        available commands.
      </div>
    ),
  },
];

const NeofetchCard = () => (
  <pre className='whitespace-pre-wrap leading-relaxed'>
    <span className='text-fuchsia-400'>taban@portfolio</span>
    {"\n"}
    <span className='text-green-500/30'>══════════════════════</span>
    {"\n"}
    <span className='text-cyan-400'>OS:</span>{" "}
    <span className='text-green-300'>Ubuntu 22.04 LTS</span>
    {"\n"}
    <span className='text-cyan-400'>Role:</span>{" "}
    <span className='text-green-300'>Data Scientist & Cloud Engineer</span>
    {"\n"}
    <span className='text-cyan-400'>Focus:</span>{" "}
    <span className='text-green-300'>Data Science, AWS, Refugee Tech</span>
    {"\n"}
    <span className='text-cyan-400'>Shell:</span>{" "}
    <span className='text-green-300'>bash 5.1</span>
    {"\n"}
    <span className='text-cyan-400'>Terminal:</span>{" "}
    <span className='text-green-300'>portfolio-terminal</span>
  </pre>
);

const cowsay = (message: string) => {
  const text = message || "Hello from the terminal!";
  return `  ${"-".repeat(text.length + 2)}
< ${text} >
  ${"-".repeat(text.length + 2)}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
};

export const Terminal = ({ className }: { className?: string }) => {
  const [blocks, setBlocks] = useState<OutputBlock[]>(() =>
    WELCOME_BLOCKS.map((b) => ({ ...b, id: blockId++ })),
  );
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [blocks]);

  const push = (kind: OutputBlock["kind"], content: React.ReactNode) => {
    setBlocks((prev) => [...prev, { id: blockId++, kind, content }]);
  };

  const run = (raw: string) => {
    const trimmed = raw.trim();
    push(
      "command",
      <div className='flex gap-2'>
        <span className='text-fuchsia-400'>[root@portfolio]</span>
        <span className='text-green-400'>~$</span>
        <span className='text-green-200/90'>{trimmed}</span>
      </div>,
    );

    if (!trimmed) return;

    const [cmd, ...rest] = trimmed.split(" ");
    const args = rest.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {HELP_TEXT}
          </pre>,
        );
        break;
      case "about":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {ABOUT_TEXT}
          </pre>,
        );
        break;
      case "projects":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {PROJECTS_TEXT}
          </pre>,
        );
        break;
      case "skills":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {SKILLS_TEXT}
          </pre>,
        );
        break;
      case "experience":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {EXPERIENCE_TEXT}
          </pre>,
        );
        break;
      case "contact":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {CONTACT_TEXT}
          </pre>,
        );
        break;
      case "clear":
      case "cls":
        setBlocks([]);
        return;
      case "ls":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            <span className='text-cyan-400'>about/</span>{" "}
            <span className='text-cyan-400'>projects/</span>{" "}
            <span className='text-cyan-400'>skills/</span>{" "}
            <span className='text-cyan-400'>experience/</span>{" "}
            <span className='text-cyan-400'>contact/</span>{" "}
            <span className='text-fuchsia-400'>README.md</span>
          </pre>,
        );
        break;
      case "pwd":
        push("output", <span className='text-green-400/80'>/home/taban</span>);
        break;
      case "whoami":
        push(
          "output",
          <span className='text-fuchsia-400 font-bold'>taban</span>,
        );
        break;
      case "date":
        push(
          "output",
          <span className='text-green-400/80'>{new Date().toString()}</span>,
        );
        break;
      case "echo":
        push(
          "output",
          <span className='text-green-400/80'>{args || " "}</span>,
        );
        break;
      case "neofetch":
        push("output", <NeofetchCard />);
        break;
      case "cowsay":
        push(
          "output",
          <pre className='whitespace-pre-wrap text-green-400/80'>
            {cowsay(args)}
          </pre>,
        );
        break;
      default:
        push(
          "output",
          <span className='text-red-500/90'>
            [ERROR] Command not found: {cmd}. Type 'help' for a list of
            commands.
          </span>,
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    run(value);
    setHistory((h) => [...h, value]);
    setHistoryIndex(-1);
    setValue("");
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex =
        historyIndex === -1
          ? history.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setValue(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setValue("");
      } else {
        setHistoryIndex(nextIndex);
        setValue(history[nextIndex]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const matches = COMMANDS.filter((c) => c.startsWith(value.toLowerCase()));
      if (matches.length === 1) {
        setValue(matches[0]);
        setSuggestions([]);
      } else if (matches.length > 1) {
        setSuggestions(matches);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (v.length > 0) {
      setSuggestions(COMMANDS.filter((c) => c.startsWith(v.toLowerCase())));
    } else {
      setSuggestions([]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={cn(
        "rounded-lg border border-green-500/30 overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,255,65,0.1)] bg-black/90",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {/* CRT Scanline overlay */}
      <div
        className='pointer-events-none absolute inset-0 z-10 opacity-[0.03]'
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px)",
          backgroundSize: "100% 3px",
        }}
      />

      {/* Title bar */}
      <div className='flex items-center gap-3 px-5 py-3 border-b border-green-500/20 bg-green-900/10'>
        <div className='flex items-center gap-1.5'>
          <span className='w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.6)]' />
          <span className='w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.6)]' />
          <span className='w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.6)]' />
        </div>
        <div className='flex-1 text-center text-xs text-green-400/60 font-mono tracking-widest uppercase'>
          ◈ taban@portfolio — terminal ◈
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className='flex-1 overflow-y-auto px-5 py-4 font-mono text-sm leading-relaxed max-h-[420px] min-h-[320px] relative'
      >
        {blocks.map((b) => (
          <div key={b.id} className='mb-2.5'>
            {b.content}
          </div>
        ))}

        {/* Input line */}
        <form
          onSubmit={handleSubmit}
          className='flex items-center gap-2 relative'
        >
          <span className='text-fuchsia-400 shrink-0'>[root@portfolio]</span>
          <span className='text-green-400 shrink-0'>~$</span>
          <input
            ref={inputRef}
            type='text'
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete='off'
            spellCheck={false}
            className='flex-1 bg-transparent border-none outline-none text-green-300 font-mono text-sm min-w-0 caret-green-400'
            placeholder='type a command...'
          />

          {suggestions.length > 0 && (
            <div className='absolute left-0 top-full mt-2 bg-black/95 border border-green-500/30 rounded py-1.5 z-20 min-w-[160px] shadow-[0_0_20px_rgba(0,255,65,0.15)]'>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type='button'
                  onClick={() => {
                    setValue(s);
                    setSuggestions([]);
                    inputRef.current?.focus();
                  }}
                  className='w-full text-left px-4 py-1 text-green-500/60 hover:text-green-300 hover:bg-green-500/10 transition-colors font-mono'
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};
