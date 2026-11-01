# RouteLab-Simple

An educational Computer Networks website demonstrating seven routing algorithms through interactive visualization.

## Overview

RouteLab-Simple is a browser-based simulator for learning how routing algorithms work in computer networks. Build custom network topologies, run classic routing algorithms, and visualize packet paths on an interactive canvas.

## Routing Algorithms

1. **Shortest Path Routing (Dijkstra)** — least-cost path from source to all nodes
2. **Flooding** — packet diffusion to every router
3. **Distance Vector Routing** — distributed Bellman-Ford exchange
4. **Link State Routing** — full topology + Dijkstra
5. **Hierarchical Routing** — multi-level region-based routing
6. **Broadcast Routing** — network-wide packet delivery
7. **Multicast Routing** — group-targeted packet delivery

## Technology Stack

- HTML5 & CSS3
- Vanilla JavaScript (ES6+)
- [Cytoscape.js](https://js.cytoscape.org/) (loaded via CDN)

No backend, no build tools, no dependencies to install.

## Getting Started

1. Clone or download this repository
2. Open `index.html` in any modern browser

That's it — the simulator runs entirely client-side.

## Project Structure

```
RouteLab-Simple/
├── index.html          # Main page with all sections
├── css/
│   └── style.css        # All styling (dark navy theme)
├── js/
│   ├── app.js           # Navigation, scroll, mobile menu
│   ├── network.js       # Cytoscape.js network builder logic
│   └── algorithms.js    # Algorithm section interaction handlers
└── README.md            # This file
```

## Features

### Network Builder
- Add routers to the canvas
- Connect routers with weighted links
- Set link cost
- Select source and destination routers
- Load sample network topologies (linear, mesh, star, ring, hierarchical)
- Reset the entire network

### Algorithm Sections
Each of the seven algorithms has a dedicated section with:
- Algorithm name and description
- Step-by-step explanation of how it works
- A visualization area
- Run Simulation and Reset buttons
- A results panel

### Design
- Dark navy professional network engineering aesthetic
- Blue/cyan accents with green (success) and red (unavailable) indicators
- Responsive layout for desktop and mobile

## Status

This is the foundation (Prompt 1). Algorithm simulation logic will be implemented in the next phase.

## License

Educational project — free to use for learning purposes.
