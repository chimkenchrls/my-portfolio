/* ==========================================================================
   Portfolio content — the only file to edit when updating the site.
   - Use null (never "") for anything you don't have yet; the page shows a
     "coming soon" state instead.
   - URLs must start with https://.
   - Stack icons are slugs of files in ./assets/icons/stack/ (simple-icons).
   - After editing, run: node --test tests/*.test.js
   ========================================================================== */
const PORTFOLIO_DATA = {
  profile: {
    email: 'charleskenneth129@gmail.com',
    github: 'https://github.com/chimkenchrls',
    linkedin: null,
    discord: 'de4dicated',
  },

  stats: [
    { value: 'Champion', label: 'CodeFest Tagisan ng Talino 2026' },
    { value: '2023', label: 'coding since' },
    { value: '4th yr', label: 'BS Computer Science' },
    { value: '3', label: 'projects built & building' },
  ],

  highlights: [
    { icon: 'book', label: '4th-Year BS Computer Science' },
    { icon: 'cloud', label: 'Aspiring DevOps Engineer' },
    { icon: 'briefcase', label: 'Open to OJT / Internship' },
  ],

  experience: [
    {
      title: 'BS Computer Science',
      org: 'STI College Lucena',
      dates: '2023 — 2027',
      current: true,
      bullets: ['Champion in Local CodeFest Competition Tagisan ng Talino 2026.'],
    },
    {
      title: 'OJT / Internship',
      org: 'Actively Seeking',
      dates: '2026 — Present',
      current: true,
      bullets: ['Currently seeking internship opportunities to gain practical experience and contribute to real-world projects.'],
    },
    {
      title: 'Capstone Project',
      org: 'STI College Lucena',
      dates: '2026 — Present',
      current: true,
      bullets: ['Thready: An AI Enhanced Web-Based Production Management System with Computer Vision for Garments Monitoring for Shiela and Joel Garments'],
    },
  ],

  education: [
    { school: 'STI College Lucena', degree: 'Bachelor of Science in Computer Science', dates: '2023 — Current', current: true },
    { school: 'Sariaya Institute Inc.', degree: 'Senior High School', dates: '2021 — 2023', current: false },
    { school: 'Sariaya Institute Inc.', degree: 'Junior High School', dates: '2017 — 2023', current: false },
    { school: 'Jose Rizal Elementary School', degree: 'Elementary', dates: '2011 — 2017', current: false },
  ],

  stack: [
    {
      category: 'DevOps & Cloud',
      items: [
        { name: 'Docker + Compose', icon: 'docker' },
        { name: 'Azure', icon: null },
        { name: 'Caddy 2', icon: 'caddy' },
        { name: 'GitHub Actions', icon: 'githubactions' },
        { name: "Let's Encrypt (Lego ACME client)", icon: 'letsencrypt' },
      ],
    },
    {
      category: 'Security & Identity',
      items: [
        { name: 'Tailscale', icon: 'tailscale' },
        { name: 'WireGuard (wg-easy)', icon: 'wireguard' },
      ],
    },
    {
      category: 'Backend',
      items: [
        { name: 'Node.js 20 (Alpine)', icon: 'nodedotjs' },
        { name: 'Java', icon: 'openjdk' },
        { name: 'Python', icon: 'python' },
        { name: 'PHP', icon: 'php' },
        { name: 'Express 5', icon: 'express' },
        { name: 'MySQL 8 (mysql2)', icon: 'mysql' },
        { name: 'JWT', icon: 'jsonwebtokens' },
        { name: 'Axios', icon: 'axios' },
      ],
    },
    {
      category: 'Frontend',
      items: [
        { name: 'TypeScript', icon: 'typescript' },
        { name: 'Next.js 16 (App Router)', icon: 'nextdotjs' },
        { name: 'React 18.3', icon: 'react' },
        { name: 'Tailwind CSS 3', icon: 'tailwindcss' },
        { name: 'Vite', icon: 'vite' },
        { name: 'Google Fonts (Rubik)', icon: 'googlefonts' },
      ],
    },
    {
      category: 'AI & Machine Learning',
      items: [{ name: 'Ultralytics (YOLOv8)', icon: 'ultralytics' }],
    },
    {
      category: 'Developer Tools',
      items: [
        { name: 'Git', icon: 'git' },
        { name: 'GitHub', icon: 'github' },
        { name: 'VS Code', icon: null },
        { name: 'Vitest', icon: 'vitest' },
        { name: 'Playwright', icon: null },
        { name: 'Husky', icon: null },
      ],
    },
  ],

  projects: [
    {
      title: 'AmIgo',
      meta: '2026',
      status: 'done',
      description: "AmIgo is a Discord AI bot that acts like a chaotic, laid-back group chat friend — chatting in casual Taglish when mentioned, replied to, or called by name. Powered by Google's Gemini API with per-channel conversation memory, and rounding that out with a photo-roasting command, an English tutor mode, and a persistent-facts system so it can remember and recall things about the server over time.",
      tags: ['Discord.js', 'TypeScript', 'SQLite3', 'Google Gemini API'],
      links: { source: null, live: null },
    },
    {
      title: 'Thready',
      meta: 'in progress',
      status: 'in-progress',
      description: 'AI-enhanced, web-based production management system with computer vision for garment monitoring, built as a capstone project for Shiela and Joel Garments.',
      tags: ['JavaScript'],
      links: { source: null, live: null },
    },
    {
      title: 'Ambiancy',
      meta: 'coming soon',
      status: 'coming-soon',
      description: null,
      tags: ['Python'],
      links: { source: null, live: null },
    },
  ],

  certifications: [],
  certificationsPending: 'Currently working toward certifications. Check back soon.',
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PORTFOLIO_DATA;
}
