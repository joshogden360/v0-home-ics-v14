#!/usr/bin/env python3
"""
Generate a LaTeX Codebook from Inventory Dashboard Codebase
Creates a professional, print-ready booklet with syntax highlighting
"""

import os
from datetime import datetime
from pathlib import Path

# File organization and metadata
SECTIONS = {
    "foundation": {
        "title": "Project Foundation",
        "description": "Core foundational files that define the overall structure",
        "files": [
            ("app/layout.tsx", "Root layout with theme provider and navigation"),
            ("app/globals.css", "Global styles and CSS custom properties"),
            ("middleware.ts", "Next.js middleware for authentication & routing")
        ]
    },
    "config": {
        "title": "Configuration Files", 
        "description": "Build, compilation, and deployment configuration",
        "files": [
            ("package.json", "Project dependencies, scripts, and metadata"),
            ("tsconfig.json", "TypeScript compiler configuration"),
            ("next.config.mjs", "Next.js build and runtime configuration")
        ]
    },
    "pages": {
        "title": "Core Application Pages",
        "description": "Main pages that users interact with",
        "files": [
            ("app/page.tsx", "Dashboard homepage with stats and quick actions"),
            ("app/main-nav.tsx", "Main navigation component with route definitions")
        ]
    },
    "ui": {
        "title": "UI Component Library",
        "description": "Reusable UI components built on Radix UI and Tailwind CSS",
        "files": [
            ("components/ui/button.tsx", "Base button component with variants"),
            ("components/ui/input.tsx", "Form input component with validation"),
            ("components/ui/card.tsx", "Container card component for content sections"),
            ("components/ui/form.tsx", "Form handling with React Hook Form integration"),
            ("components/ui/table.tsx", "Data table components for displaying lists")
        ]
    },
    "actions": {
        "title": "Business Logic \\& Server Actions",
        "description": "Server-side business logic implemented as Next.js Server Actions",
        "files": [
            ("lib/actions/items.ts", "Item CRUD operations, search, and filtering"),
            ("lib/actions/rooms.ts", "Room management and location tracking"),
            ("lib/actions/dashboard.ts", "Dashboard statistics and data aggregation")
        ]
    },
    "state": {
        "title": "State Management (Jotai)",
        "description": "Jotai atoms for atomic state management",
        "files": [
            ("lib/atoms/atoms.ts", "Main UI atoms (sidebar, theme, search, filters)"),
            ("lib/atoms/ai.ts", "AI analysis state (image processing, results)")
        ]
    },
    "utils": {
        "title": "Core Utilities \\& Types",
        "description": "Fundamental utilities, type definitions, and database logic",
        "files": [
            ("lib/types.ts", "TypeScript interfaces for Item, Room, Maintenance, etc."),
            ("lib/utils.ts", "Utility functions (className merging, formatting)"),
            ("lib/db.ts", "Database connection and query helpers")
        ]
    }
}

def get_language(filepath):
    """Get the language for syntax highlighting."""
    lang_map = {
        '.tsx': 'typescript', '.ts': 'typescript', 
        '.jsx': 'javascript', '.js': 'javascript',
        '.css': 'css', '.json': 'json', '.mjs': 'javascript'
    }
    ext = Path(filepath).suffix.lower()
    return lang_map.get(ext, 'text')

def generate_latex_document():
    """Generate the complete LaTeX document."""
    current_date = datetime.now().strftime("%B %d, %Y")
    
    # LaTeX document header
    latex_content = f"""\\documentclass[11pt,twoside,openright]{{book}}

% Essential packages
\\usepackage[utf8]{{inputenc}}
\\usepackage[T1]{{fontenc}}
\\usepackage{{geometry}}
\\usepackage{{fancyhdr}}
\\usepackage{{tocloft}}
\\usepackage{{titlesec}}
\\usepackage{{xcolor}}
\\usepackage{{listings}}
\\usepackage{{courier}}
\\usepackage{{hyperref}}
\\usepackage{{bookmark}}

% Page setup for letter size, duplex printing
\\geometry{{
    letterpaper,
    inner=1in,
    outer=0.75in,
    top=1in,
    bottom=1in,
    headheight=14pt
}}

% Define colors for syntax highlighting
\\definecolor{{codebackground}}{{RGB}}{{248, 248, 248}}
\\definecolor{{commentcolor}}{{RGB}}{{0, 128, 0}}
\\definecolor{{keywordcolor}}{{RGB}}{{0, 0, 255}}
\\definecolor{{stringcolor}}{{RGB}}{{163, 21, 21}}

% Configure code listings
\\lstset{{
    backgroundcolor=\\color{{codebackground}},
    commentstyle=\\color{{commentcolor}},
    keywordstyle=\\color{{keywordcolor}},
    stringstyle=\\color{{stringcolor}},
    basicstyle=\\footnotesize\\ttfamily,
    breaklines=true,
    numbers=left,
    numberstyle=\\tiny\\color{{gray}},
    frame=single,
    frameround=tttt,
    framesep=5pt,
    xleftmargin=10pt,
    xrightmargin=10pt,
    tabsize=2,
    showstringspaces=false
}}

% TypeScript language definition
\\lstdefinelanguage{{typescript}}{{
    keywords={{abstract,any,as,break,case,catch,class,const,continue,declare,default,delete,do,else,enum,export,extends,false,finally,for,from,function,get,if,implements,import,in,instanceof,interface,let,module,namespace,new,null,number,object,package,private,protected,public,readonly,return,set,static,string,super,switch,this,throw,true,try,type,typeof,undefined,var,void,while,with,yield}},
    keywordstyle=\\color{{keywordcolor}},
    comment=[l]{{//}},
    morecomment=[s]{{/*}}{{*/}},
    morestring=[b]',
    morestring=[b]"
}}

% Headers and footers
\\pagestyle{{fancy}}
\\fancyhf{{}}
\\fancyhead[LE]{{\\leftmark}}
\\fancyhead[RO]{{\\rightmark}}
\\fancyfoot[LE,RO]{{\\thepage}}
\\renewcommand{{\\headrulewidth}}{{0.4pt}}

% Title page
\\title{{\\Huge\\textbf{{Inventory Dashboard}}\\\\
\\Large Complete Codebase Reference\\\\
\\vspace{{1cm}}
\\large Next.js 15 + TypeScript + Jotai + AI}}
\\author{{Generated from Source Code}}
\\date{{{current_date}}}

% Custom commands
\\newcommand{{\\filepath}}[1]{{\\texttt{{#1}}}}
\\newcommand{{\\codesection}}[3]{{
    \\section{{#1}}
    \\textbf{{Location:}} \\filepath{{#2}}\\\\
    \\textbf{{Description:}} #3\\\\
}}

\\begin{{document}}

% Title page
\\maketitle
\\thispagestyle{{empty}}

% Table of contents
\\cleardoublepage
\\tableofcontents

% Architecture overview
\\cleardoublepage
\\chapter{{Project Architecture}}

This document contains the complete source code for the Inventory Dashboard application, a comprehensive Next.js-based inventory management system with AI-powered analysis capabilities.

\\section{{Technology Stack}}
\\begin{{itemize}}
    \\item \\textbf{{Framework:}} Next.js 15.2.4 with App Router
    \\item \\textbf{{Language:}} TypeScript 5+
    \\item \\textbf{{UI Library:}} React 19
    \\item \\textbf{{State Management:}} Jotai (atomic state management)
    \\item \\textbf{{Styling:}} Tailwind CSS + shadcn/ui components
    \\item \\textbf{{Database:}} PostgreSQL via Neon Serverless
    \\item \\textbf{{AI Integration:}} Google Gemini 1.5 Flash
\\end{{itemize}}

"""

    # Generate chapters for each section
    for section_key, section_data in SECTIONS.items():
        latex_content += f"""
\\cleardoublepage
\\chapter{{{section_data['title']}}}

{section_data['description']}

"""
        
        # Add each file in the section
        for filepath, description in section_data['files']:
            filename = os.path.basename(filepath)
            language = get_language(filepath)
            
            latex_content += f"""
\\codesection{{{filename}}}{{{filepath}}}{{{description}}}

\\lstinputlisting[language={language},caption={{{filename}}}]{{{filepath}}}

\\clearpage

"""

    # Appendices
    latex_content += """
\\appendix

\\chapter{Quick Reference}

\\section{Finding Code by Feature}
\\begin{itemize}
    \\item \\textbf{User Interface} → \\filepath{components/ui/}
    \\item \\textbf{Data Operations} → \\filepath{lib/actions/}
    \\item \\textbf{State Management} → \\filepath{lib/atoms/}
    \\item \\textbf{Type Definitions} → \\filepath{lib/types.ts}
    \\item \\textbf{Database} → \\filepath{lib/db.ts}
\\end{itemize}

\\section{Key Patterns}
\\begin{itemize}
    \\item \\textbf{Server Actions} → \\texttt{"use server"} functions
    \\item \\textbf{Client Components} → \\texttt{"use client"} components
    \\item \\textbf{Jotai Atoms} → State definitions in \\filepath{lib/atoms/}
    \\item \\textbf{Type Safety} → Interface definitions in \\filepath{lib/types.ts}
\\end{itemize}

\\end{document}
"""

    return latex_content

def main():
    """Generate the LaTeX codebook."""
    print("🔨 Generating LaTeX Codebook for Inventory Dashboard...")
    
    # Generate the LaTeX content
    latex_content = generate_latex_document()
    
    # Write to file
    output_file = "inventory-dashboard-codebook.tex"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(latex_content)
    
    print(f"✅ Generated {output_file}")
    print(f"📄 File size: {len(latex_content)} characters")
    print("\n📚 COMPILATION INSTRUCTIONS:")
    print(f"1. pdflatex {output_file}")
    print(f"2. pdflatex {output_file}  # Run twice for TOC")
    print("3. Output: inventory-dashboard-codebook.pdf")
    print("\n🎯 FEATURES: Professional formatting, syntax highlighting, TOC, ~60-80 pages")

if __name__ == "__main__":
    main()
