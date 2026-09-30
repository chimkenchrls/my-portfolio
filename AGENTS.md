# Agent Instructions: Static Website Project
1. Project Overview
Project Name: Kenneth Charles Valdez Portfolio

Category: Personal Portfolio

Description: This portfolio showcases hands-on expertise in cloud infrastructure automation, CI/CD pipeline construction, and containerized deployments designed for hiring managers and technical recruiters looking for junior or associate DevOps talent. It bridges the gap between software development and operations by demonstrating practical experience with modern cloud architectures, infrastructure as code, and system reliability monitoring.

Primary Goal: Showcase portfolio

2. Technical Stack & Constraints
Core Stack: Plain HTML5, CSS3, Vanilla JavaScript (ES6+).

Zero External Dependencies: Do NOT use external build tools, package managers (npm/yarn), or thirdparty CSS/JS frameworks (no Tailwind CDN, Bootstrap, React, or jQuery).

Font & Icon Constraints: Modern web-safe system font stacks or Google Fonts via `` tag. Use inline SVGs or local SVG files in assets/ for icons.

Paths: All internal links, stylesheets, scripts, and asset references must use relative paths (e.g., ./assets/logo.png, ./style.css, ./script.js) to ensure compatibility with GitHub Pages subdirectory hosting.

## 3. Directory Layout
```text
my-website/
├── AGENTS.md
├── index.html
├── style.css
├── script.js
└── assets/
 └── [List key files placed here, e.g., logo.png, hero.jpg]

4. UI/UX & Design GuidelinesColor Palette: Monochromatic, high-contrast, minimalist theme.   Primary / Text: #000000 (Pure Black) for main typography, headings, and section borders.   Background: #FFFFFF (White) featuring a subtle, faint dotted grid pattern across the entire canvas.   Accent / Meta: Light gray for secondary text, timestamps, and subtle keyboard shortcut UI boxes.   Typography: A brutalist, terminal-inspired aesthetic utilizing a monospace font stack (e.g., Courier New, Roboto Mono, Fira Code) for navigation links, metadata, and structural elements, paired with clean sans-serif for body paragraphs.   Layout Approach: A fixed two-column desktop layout utilizing a static left-hand sidebar for navigation and a scrollable right-hand main content area. Built using CSS Flexbox and CSS Grid.   Visual Style: Use extremely thin (1px solid #eaeaea) lines for borders and dividers between grid items and list rows. All profile imagery should feature a black-and-white, dithered, or halftone filter effect.   Responsiveness: Fluid breakpoints (Mobile: < 640px, Tablet: 640px - 1024px, Desktop: > 1024px). On mobile, the left sidebar must collapse into a mobile hamburger menu.

5. Required SectionsSidebar / Navigation (Left Column):Top: Minimalist text-based brand/name.   
Middle: Categorized vertical navigation links (e.g., Projects, Experience, Stack) with small, simple vector icons for primary sections.   
Interactive widgets: Small keyboard shortcut hints (e.g., Alt + K) next to search or chat actions.   
Bottom: System toggles (light/dark mode, sound), visitor count metrics, and a direct plaintext email contact link.   Hero Section (Main Column):Halftone/dithered portrait image centered or left-aligned above the bio.   Large, crisp heading for the name.   Short, punchy professional bio.   Minimalist social links rendered as lowercase plain text, separated by slashes (e.g., github / linkedin / instagram / x).   
Core Content Section (Main Column):Stats & Highlights Grid: A multi-column horizontal grid separated by thin borders displaying key metrics, community sizes, hackathon wins, or certifications.   Project/Experience List: Clean, list-based rows for projects or articles. The item title is left-aligned, and the date/year is right-aligned in a smaller, lighter monospace font.   Interactive Feature: Light/Dark mode toggle in the sidebar and keyboard shortcut navigation listeners.Contact / CTA Section: Directly integrated into the bottom-left sidebar as a clean, copyable email address and status indicator.   

6. Agent Rules of EngagementAlways generate complete, functional code blocks—avoid placeholders, ellipsis comments (/* code continues here */), or truncated snippets.Ensure semantic HTML tags are prioritized (`, , ``, , , , `).Keep CSS organized with clear section headers, CSS custom properties (:root), and smooth transitions.Keep JavaScript modular, event-driven, and scoped without polluting global namespace.