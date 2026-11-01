/* ============================================
   RouteLab-Simple | algorithms.js
   Seven routing algorithm implementations
   ============================================ */

var RouteLab = RouteLab || {};

RouteLab.Algorithms = (function () {
    'use strict';

    var ALGO_MAP = {
        'dijkstra': { panelId: 'resultsDijkstra', vizId: 'vizDijkstra', name: 'Shortest Path Routing (Dijkstra)' },
        'flooding': { panelId: 'resultsFlooding', vizId: 'vizFlooding', name: 'Flooding' },
        'distance-vector': { panelId: 'resultsDistanceVector', vizId: 'vizDistanceVector', name: 'Distance Vector Routing' },
        'link-state': { panelId: 'resultsLinkState', vizId: 'vizLinkState', name: 'Link State Routing' },
        'hierarchical': { panelId: 'resultsHierarchical', vizId: 'vizHierarchical', name: 'Hierarchical Routing' },
        'broadcast': { panelId: 'resultsBroadcast', vizId: 'vizBroadcast', name: 'Broadcast Routing' },
        'multicast': { panelId: 'resultsMulticast', vizId: 'vizMulticast', name: 'Multicast Routing' }
    };

    /* ===== Graph Helpers ===== */

    function buildAdjList(graph) {
        var adj = {};
        graph.nodes.forEach(function (n) { adj[n.id] = []; });
        graph.edges.forEach(function (e) {
            if (adj[e.source]) adj[e.source].push({ node: e.target, cost: e.cost });
            if (adj[e.target]) adj[e.target].push({ node: e.source, cost: e.cost });
        });
        return adj;
    }

    function dijkstra(adj, source) {
        var dist = {}, prev = {}, visited = {};
        var nodeIds = Object.keys(adj);
        nodeIds.forEach(function (n) {
            dist[n] = Infinity; prev[n] = null; visited[n] = false;
        });
        dist[source] = 0;
        while (true) {
            var u = null, minD = Infinity;
            nodeIds.forEach(function (n) {
                if (!visited[n] && dist[n] < minD) { minD = dist[n]; u = n; }
            });
            if (u === null) break;
            visited[u] = true;
            adj[u].forEach(function (nb) {
                var alt = dist[u] + nb.cost;
                if (alt < dist[nb.node]) { dist[nb.node] = alt; prev[nb.node] = u; }
            });
        }
        return { dist: dist, prev: prev };
    }

    function getPathFromPrev(prev, source, dest) {
        var path = [], cur = dest;
        while (cur !== null) {
            path.unshift(cur);
            if (cur === source) return path;
            cur = prev[cur];
        }
        return null;
    }

    function findEdgeId(a, b) {
        var cy = RouteLab.Network.getCy();
        if (!cy) return null;
        if (cy.getElementById(a + '-' + b).nonempty()) return a + '-' + b;
        if (cy.getElementById(b + '-' + a).nonempty()) return b + '-' + a;
        return null;
    }

    function getEdgeIdsForPath(path) {
        var ids = [];
        for (var i = 0; i < path.length - 1; i++) {
            var eid = findEdgeId(path[i], path[i + 1]);
            if (eid) ids.push(eid);
        }
        return ids;
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* ===== Display Helpers ===== */

    function showResult(panel, html) { panel.innerHTML = html; }

    function showError(panel, msg) {
        panel.innerHTML = '<p class="result-error">&#9888; ' + escapeHtml(msg) + '</p>';
    }

    function makeTable(headers, rows) {
        var h = '<table class="result-table"><tr>';
        headers.forEach(function (hd) { h += '<th>' + escapeHtml(hd) + '</th>'; });
        h += '</tr>';
        rows.forEach(function (r) {
            h += '<tr>';
            r.forEach(function (c) { h += '<td>' + escapeHtml(String(c)) + '</td>'; });
            h += '</tr>';
        });
        return h + '</table>';
    }

    function setVizHint(vizId, msg) {
        var el = document.getElementById(vizId);
        if (el) el.innerHTML = '<div class="algo-viz-hint">' + escapeHtml(msg) + '</div>';
    }

    function clearViz(vizId) {
        var el = document.getElementById(vizId);
        if (el) el.innerHTML = '';
    }

    function clearAllAlgoHighlights() {
        if (RouteLab.Network.clearAlgoClasses) RouteLab.Network.clearAlgoClasses();
    }

    /* ===== Validation ===== */

    function validateNetwork(panel) {
        var graph = RouteLab.Network.getGraphData();
        if (!graph || graph.nodes.length === 0) {
            showError(panel, 'No network built yet. Go to the Network Builder and create a topology first.');
            return null;
        }
        return graph;
    }

    function validateSource(panel, graph) {
        var s = RouteLab.Network.getSelectedSource();
        if (!s) { showError(panel, 'Please select a source router in the Network Builder.'); return null; }
        var found = graph.nodes.filter(function (n) { return n.id === s; }).length > 0;
        if (!found) { showError(panel, 'Source router ' + s + ' no longer exists in the network.'); return null; }
        return s;
    }

    function validateSourceDest(panel, graph) {
        var s = validateSource(panel, graph);
        if (!s) return null;
        var d = RouteLab.Network.getSelectedDest();
        if (!d) { showError(panel, 'Please select a destination router in the Network Builder.'); return null; }
        if (s === d) { showError(panel, 'Source and destination must be different routers.'); return null; }
        var found = graph.nodes.filter(function (n) { return n.id === d; }).length > 0;
        if (!found) { showError(panel, 'Destination router ' + d + ' no longer exists in the network.'); return null; }
        return { source: s, dest: d };
    }

    /* ===== 1. Dijkstra — Shortest Path ===== */

    function runDijkstra(panel, graph, vizId) {
        var sd = validateSourceDest(panel, graph);
        if (!sd) return;
        var adj = buildAdjList(graph);
        var result = dijkstra(adj, sd.source);

        if (result.dist[sd.dest] === Infinity) {
            RouteLab.Network.addClassToElements([sd.dest], null, 'algo-unreachable');
            showError(panel, 'Destination ' + sd.dest + ' is unreachable from ' + sd.source + '. No path exists.');
            setVizHint(vizId, 'Destination unreachable \u2014 see Network Builder canvas');
            return;
        }

        var path = getPathFromPrev(result.prev, sd.source, sd.dest);
        var edgeIds = getEdgeIdsForPath(path);
        RouteLab.Network.highlightPath(path, edgeIds);

        var html = '<div class="result-section">';
        html += '<p class="result-path">Shortest Path: <strong>' + path.join(' \u2192 ') + '</strong></p>';
        html += '<p class="result-cost">Total Cost: <strong>' + result.dist[sd.dest] + '</strong></p>';
        html += '<p class="result-detail">Hops: <strong>' + (path.length - 1) + '</strong></p>';
        html += '</div>';
        html += '<p class="result-info">All distances from ' + sd.source + ':</p>';
        var rows = graph.nodes.map(function (n) {
            var d = result.dist[n.id];
            var p = result.prev[n.id];
            return [n.id, d === Infinity ? '\u221E' : d, p || '-'];
        });
        html += makeTable(['Router', 'Distance', 'Previous Hop'], rows);
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See highlighted path on the Network Builder canvas');
    }

    /* ===== 2. Flooding ===== */

    function runFlooding(panel, graph, vizId) {
        var source = validateSource(panel, graph);
        if (!source) return;
        var adj = buildAdjList(graph);
        var visited = {};
        var transmittedEdgeIds = [];
        var transmissions = [];
        var hopLimit = graph.nodes.length;

        var queue = [{ node: source, from: null, hop: 0 }];
        visited[source] = true;

        while (queue.length > 0) {
            var item = queue.shift();
            if (item.hop >= hopLimit) continue;
            adj[item.node].forEach(function (nb) {
                if (nb.node === item.from) return;
                var eid = findEdgeId(item.node, nb.node);
                if (eid && transmittedEdgeIds.indexOf(eid) === -1) transmittedEdgeIds.push(eid);
                transmissions.push({ from: item.node, to: nb.node, hop: item.hop + 1, dup: !!visited[nb.node] });
                if (!visited[nb.node]) {
                    visited[nb.node] = true;
                    queue.push({ node: nb.node, from: item.node, hop: item.hop + 1 });
                }
            });
        }

        var visitedNodes = Object.keys(visited);
        var uniqueTx = transmissions.filter(function (t) { return !t.dup; });
        var dupTx = transmissions.filter(function (t) { return t.dup; });

        RouteLab.Network.addClassToElements(visitedNodes, transmittedEdgeIds, 'algo-visited');

        var html = '<div class="result-section">';
        html += '<p class="result-info">Routers reached: <strong>' + visitedNodes.length + '</strong> / ' + graph.nodes.length + '</p>';
        html += '<p class="result-detail">Hop limit (TTL): <strong>' + hopLimit + '</strong></p>';
        html += '<p class="result-detail">Total transmissions: <strong>' + transmissions.length + '</strong></p>';
        html += '<p class="result-detail">Useful transmissions: <strong>' + uniqueTx.length + '</strong> (first-time deliveries)</p>';
        html += '<p class="result-detail">Duplicate transmissions: <strong>' + dupTx.length + '</strong> (suppressed by visited check)</p>';
        html += '</div>';
        if (visitedNodes.length < graph.nodes.length) {
            var unreached = graph.nodes.filter(function (n) { return !visited[n.id]; }).map(function (n) { return n.id; });
            html += '<p class="result-error">Unreachable routers: ' + unreached.join(', ') + '</p>';
        }
        html += '<p class="result-info">Transmission log (first-time deliveries):</p>';
        var rows = uniqueTx.map(function (t) { return [t.hop, t.from + ' \u2192 ' + t.to]; });
        html += makeTable(['Hop', 'Transmission'], rows);
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See flooded routers and links on the Network Builder canvas');
    }

    /* ===== 3. Distance Vector ===== */

    function runDistanceVector(panel, graph, vizId) {
        var adj = buildAdjList(graph);
        var nodeIds = graph.nodes.map(function (n) { return n.id; });
        var dist = {}, nextHop = {};

        nodeIds.forEach(function (i) {
            dist[i] = {}; nextHop[i] = {};
            nodeIds.forEach(function (j) {
                if (i === j) { dist[i][j] = 0; nextHop[i][j] = '-'; }
                else {
                    var direct = Infinity;
                    adj[i].forEach(function (nb) { if (nb.node === j) direct = nb.cost; });
                    dist[i][j] = direct;
                    nextHop[i][j] = direct === Infinity ? null : j;
                }
            });
        });

        var rounds = 0, changed = true;
        var maxRounds = nodeIds.length * (nodeIds.length - 1) + 1;

        while (changed && rounds < maxRounds) {
            changed = false; rounds++;
            nodeIds.forEach(function (i) {
                adj[i].forEach(function (nb) {
                    var k = nb.node, lc = nb.cost;
                    nodeIds.forEach(function (j) {
                        if (lc + dist[k][j] < dist[i][j]) {
                            dist[i][j] = lc + dist[k][j];
                            nextHop[i][j] = k;
                            changed = true;
                        }
                    });
                });
            });
        }

        var source = RouteLab.Network.getSelectedSource();
        var dest = RouteLab.Network.getSelectedDest();

        var html = '<div class="result-section">';
        html += '<p class="result-info">Converged in <strong>' + rounds + '</strong> round(s)</p>';
        html += '</div>';

        if (source && dest && source !== dest && dist[source] && dist[source][dest] !== Infinity) {
            var path = [source], cur = source, safety = 0;
            while (cur !== dest && safety < nodeIds.length) {
                cur = nextHop[cur][dest]; if (!cur) break;
                path.push(cur); safety++;
            }
            if (cur === dest) {
                var edgeIds = getEdgeIdsForPath(path);
                RouteLab.Network.highlightPath(path, edgeIds);
                html += '<p class="result-path">Path ' + source + ' \u2192 ' + dest + ': <strong>' + path.join(' \u2192 ') + '</strong></p>';
                html += '<p class="result-cost">Cost: <strong>' + dist[source][dest] + '</strong></p>';
            }
        } else if (source && dest && source !== dest && dist[source] && dist[source][dest] === Infinity) {
            html += '<p class="result-error">' + dest + ' is unreachable from ' + source + '</p>';
        }

        if (source && dist[source]) {
            html += '<p class="result-info">Routing table for ' + source + ':</p>';
            var rows = nodeIds.map(function (j) {
                return [j, dist[source][j] === Infinity ? '\u221E' : dist[source][j], nextHop[source][j] || '-'];
            });
            html += makeTable(['Destination', 'Cost', 'Next Hop'], rows);
        } else {
            html += '<p class="result-info">Routing tables for all routers:</p>';
            nodeIds.forEach(function (i) {
                html += '<details><summary>' + i + ' routing table</summary>';
                var rows = nodeIds.map(function (j) {
                    return [j, dist[i][j] === Infinity ? '\u221E' : dist[i][j], nextHop[i][j] || '-'];
                });
                html += makeTable(['Dest', 'Cost', 'Next Hop'], rows);
                html += '</details>';
            });
        }
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See routing tables above. Select source & dest to highlight a path.');
    }

    /* ===== 4. Link State ===== */

    function runLinkState(panel, graph, vizId) {
        var sd = validateSourceDest(panel, graph);
        if (!sd) return;
        var adj = buildAdjList(graph);

        // Step 1: Each router discovers neighbors and builds LSP
        var lsps = {};
        graph.nodes.forEach(function (n) {
            lsps[n.id] = adj[n.id].map(function (nb) {
                return nb.node + '(' + nb.cost + ')';
            });
        });

        // Step 2: LSPs are flooded — every router builds full topology (simulated)
        // Step 3: Source router runs Dijkstra on the full topology
        var result = dijkstra(adj, sd.source);

        if (result.dist[sd.dest] === Infinity) {
            RouteLab.Network.addClassToElements([sd.dest], null, 'algo-unreachable');
            showError(panel, 'Destination ' + sd.dest + ' is unreachable from ' + sd.source + '.');
            setVizHint(vizId, 'Destination unreachable');
            return;
        }

        var path = getPathFromPrev(result.prev, sd.source, sd.dest);
        var edgeIds = getEdgeIdsForPath(path);
        RouteLab.Network.highlightPath(path, edgeIds);

        var html = '<div class="result-section">';
        html += '<p class="result-info">Step 1 — Link-State Packets (LSPs):</p>';
        graph.nodes.forEach(function (n) {
            html += '<div class="result-lsp"><strong>' + n.id + '</strong>: links \u2192 ' + (lsps[n.id].length ? lsps[n.id].join(', ') : '(none)') + '</div>';
        });
        html += '<p class="result-info">Step 2 — LSPs flooded to all routers. Each router now has the full topology map (' + graph.nodes.length + ' routers, ' + graph.edges.length + ' links).</p>';
        html += '<p class="result-info">Step 3 — Source router ' + sd.source + ' runs Dijkstra on the complete topology:</p>';
        html += '<p class="result-path">Shortest Path: <strong>' + path.join(' \u2192 ') + '</strong></p>';
        html += '<p class="result-cost">Total Cost: <strong>' + result.dist[sd.dest] + '</strong></p>';
        html += '<p class="result-detail">Unlike plain Dijkstra, each router first discovers its local links, floods LSPs network-wide, then computes shortest paths from the full map.</p>';
        html += '</div>';
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See LSPs, topology, and highlighted path above');
    }

    /* ===== 5. Hierarchical Routing ===== */

    function runHierarchical(panel, graph, vizId) {
        var sd = validateSourceDest(panel, graph);
        if (!sd) return;
        var areaCount = 3;
        var areaSel = document.getElementById('areaCountSelect');
        if (areaSel) areaCount = parseInt(areaSel.value, 10) || 3;

        var adj = buildAdjList(graph);
        var nodeIds = graph.nodes.map(function (n) { return n.id; });

        // Partition into areas using multi-source BFS
        var areas = {}, areaLetters = ['A', 'B', 'C', 'D'];
        var seeds = [], step = Math.max(1, Math.floor(nodeIds.length / areaCount));
        for (var si = 0; si < areaCount && si * step < nodeIds.length; si++) {
            seeds.push(nodeIds[si * step]);
        }
        var queue = [];
        seeds.forEach(function (s, idx) { areas[s] = areaLetters[idx]; queue.push({ n: s, a: areaLetters[idx] }); });
        while (queue.length > 0) {
            var item = queue.shift();
            adj[item.n].forEach(function (nb) {
                if (!areas[nb.node]) { areas[nb.node] = item.a; queue.push({ n: nb.node, a: item.a }); }
            });
        }
        nodeIds.forEach(function (n) { if (!areas[n]) areas[n] = 'A'; });

        // Find border routers (connected to multiple areas)
        var borderRouters = {};
        graph.edges.forEach(function (e) {
            if (areas[e.source] !== areas[e.target]) { borderRouters[e.source] = true; borderRouters[e.target] = true; }
        });

        var sourceArea = areas[sd.source], destArea = areas[sd.dest];

        // Compute route using Dijkstra on full graph
        var result = dijkstra(adj, sd.source);
        if (result.dist[sd.dest] === Infinity) {
            showError(panel, 'Destination ' + sd.dest + ' is unreachable from ' + sd.source + '.');
            return;
        }
        var path = getPathFromPrev(result.prev, sd.source, sd.dest);
        var edgeIds = getEdgeIdsForPath(path);
        RouteLab.Network.highlightPath(path, edgeIds);

        // Color areas
        var areaClassMap = { A: 'algo-area-a', B: 'algo-area-b', C: 'algo-area-c', D: 'algo-area-d' };
        Object.keys(areas).forEach(function (r) {
            RouteLab.Network.addClassToElements([r], null, areaClassMap[areas[r]]);
        });

        var borderOnPath = path.filter(function (n) { return borderRouters[n]; });
        var borderList = Object.keys(borderRouters).sort();

        var html = '<div class="result-section">';
        html += '<p class="result-info">Network partitioned into <strong>' + areaCount + '</strong> areas:</p>';
        var areaGroups = {};
        nodeIds.forEach(function (n) {
            if (!areaGroups[areas[n]]) areaGroups[areas[n]] = [];
            areaGroups[areas[n]].push(n);
        });
        Object.keys(areaGroups).sort().forEach(function (a) {
            html += '<p class="result-detail">Area ' + a + ': ' + areaGroups[a].join(', ') + '</p>';
        });
        html += '<p class="result-detail">Border routers (connect different areas): <strong>' + (borderList.length ? borderList.join(', ') : 'none') + '</strong></p>';
        html += '</div>';

        if (sourceArea === destArea) {
            html += '<p class="result-info">Source and destination are in the same area (' + sourceArea + '). Intra-area routing applied.</p>';
        } else {
            html += '<p class="result-info">Source in Area ' + sourceArea + ', destination in Area ' + destArea + '. Inter-area routing applied.</p>';
            if (borderOnPath.length > 0) {
                html += '<p class="result-detail">Route crosses area boundary via border router(s): <strong>' + borderOnPath.join(', ') + '</strong></p>';
            }
        }
        html += '<p class="result-path">Route: <strong>' + path.join(' \u2192 ') + '</strong></p>';
        html += '<p class="result-cost">Total Cost: <strong>' + result.dist[sd.dest] + '</strong></p>';
        html += '<p class="result-detail">In hierarchical routing, routers only need detailed knowledge of their own area. Inter-area traffic is handled by border routers, reducing table size and control overhead.</p>';
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See area-colored routers and highlighted route on the canvas');
    }

    /* ===== 6. Broadcast Routing ===== */

    function runBroadcast(panel, graph, vizId) {
        var source = validateSource(panel, graph);
        if (!source) return;
        var adj = buildAdjList(graph);

        // Build BFS spanning tree from source
        var parent = {}, visited = {}, treeEdgeIds = [];
        var queue = [source];
        visited[source] = true; parent[source] = null;
        while (queue.length > 0) {
            var node = queue.shift();
            adj[node].forEach(function (nb) {
                if (!visited[nb.node]) {
                    visited[nb.node] = true; parent[nb.node] = node;
                    var eid = findEdgeId(node, nb.node);
                    if (eid) treeEdgeIds.push(eid);
                    queue.push(nb.node);
                }
            });
        }

        var reachedNodes = Object.keys(visited);
        RouteLab.Network.highlightPath(reachedNodes, treeEdgeIds);

        var html = '<div class="result-section">';
        html += '<p class="result-info">Spanning tree from ' + source + ':</p>';
        html += '<p class="result-detail">Routers reached: <strong>' + reachedNodes.length + '</strong> / ' + graph.nodes.length + '</p>';
        html += '<p class="result-detail">Tree edges used: <strong>' + treeEdgeIds.length + '</strong> (out of ' + graph.edges.length + ' total links)</p>';
        html += '<p class="result-detail">Efficiency: each router receives exactly one copy of the packet (no duplicates).</p>';
        html += '</div>';
        var treeRows = reachedNodes.map(function (n) {
            return [n, parent[n] || '(root)', parent[n] ? findEdgeId(parent[n], n) || '-' : '-'];
        });
        html += '<p class="result-info">Spanning tree structure:</p>';
        html += makeTable(['Router', 'Parent', 'Tree Edge'], treeRows);
        if (reachedNodes.length < graph.nodes.length) {
            var unreached = graph.nodes.filter(function (n) { return !visited[n.id]; }).map(function (n) { return n.id; });
            html += '<p class="result-error">Unreachable routers: ' + unreached.join(', ') + '</p>';
        }
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See broadcast spanning tree on the Network Builder canvas');
    }

    /* ===== 7. Multicast Routing ===== */

    function runMulticast(panel, graph, vizId) {
        var source = validateSource(panel, graph);
        if (!source) return;

        var msel = document.getElementById('multicastGroupSelect');
        var members = [];
        if (msel) {
            for (var i = 0; i < msel.options.length; i++) {
                if (msel.options[i].selected && msel.options[i].value) members.push(msel.options[i].value);
            }
        }
        members = members.filter(function (m) { return m !== source; });

        if (members.length === 0) {
            showError(panel, 'Select at least one multicast group member (other than the source) in the list above.');
            return;
        }

        var adj = buildAdjList(graph);
        var result = dijkstra(adj, source);

        // Build distribution tree (union of shortest paths to all members)
        var treeNodes = {}, treeEdgeIds = [];
        treeNodes[source] = true;
        var reachableMembers = [], unreachableMembers = [];

        members.forEach(function (m) {
            if (result.dist[m] === Infinity) { unreachableMembers.push(m); return; }
            reachableMembers.push(m);
            var path = getPathFromPrev(result.prev, source, m);
            path.forEach(function (n) { treeNodes[n] = true; });
            getEdgeIdsForPath(path).forEach(function (eid) {
                if (treeEdgeIds.indexOf(eid) === -1) treeEdgeIds.push(eid);
            });
        });

        var treeNodeList = Object.keys(treeNodes);
        RouteLab.Network.highlightPath(treeNodeList, treeEdgeIds);
        RouteLab.Network.addClassToElements(reachableMembers, null, 'algo-member');

        var html = '<div class="result-section">';
        html += '<p class="result-info">Multicast group: <strong>' + members.join(', ') + '</strong></p>';
        html += '<p class="result-detail">Source: <strong>' + source + '</strong></p>';
        html += '<p class="result-detail">Reachable members: <strong>' + reachableMembers.length + '</strong> / ' + members.length + '</p>';
        if (unreachableMembers.length > 0) {
            html += '<p class="result-error">Unreachable members: ' + unreachableMembers.join(', ') + '</p>';
        }
        html += '</div>';

        if (reachableMembers.length > 0) {
            html += '<p class="result-info">Source-rooted distribution tree:</p>';
            html += '<p class="result-detail">Tree nodes: ' + treeNodeList.join(', ') + '</p>';
            html += '<p class="result-detail">Tree edges: <strong>' + treeEdgeIds.length + '</strong></p>';
            var totalCost = 0;
            reachableMembers.forEach(function (m) { totalCost += result.dist[m]; });
            html += '<p class="result-cost">Sum of path costs to all members: <strong>' + totalCost + '</strong></p>';
            html += '<p class="result-info">Paths to each member:</p>';
            var rows = reachableMembers.map(function (m) {
                var path = getPathFromPrev(result.prev, source, m);
                return [m, path.join(' \u2192 '), result.dist[m]];
            });
            html += makeTable(['Member', 'Path', 'Cost'], rows);
            html += '<p class="result-detail">Only tree branches leading to group members carry multicast traffic. Non-member routers on shared paths forward packets but do not consume them.</p>';
        }
        showResult(panel, html);
        setVizHint(vizId, '\u2190 See multicast tree on the canvas (green=tree, orange border=members)');
    }

    /* ===== Dispatch ===== */

    function runSimulation(algoKey) {
        var info = ALGO_MAP[algoKey];
        if (!info) return;
        var panel = document.getElementById(info.panelId);
        if (!panel) return;

        var graph = validateNetwork(panel);
        if (!graph) return;

        clearAllAlgoHighlights();
        clearViz(info.vizId);

        switch (algoKey) {
            case 'dijkstra': runDijkstra(panel, graph, info.vizId); break;
            case 'flooding': runFlooding(panel, graph, info.vizId); break;
            case 'distance-vector': runDistanceVector(panel, graph, info.vizId); break;
            case 'link-state': runLinkState(panel, graph, info.vizId); break;
            case 'hierarchical': runHierarchical(panel, graph, info.vizId); break;
            case 'broadcast': runBroadcast(panel, graph, info.vizId); break;
            case 'multicast': runMulticast(panel, graph, info.vizId); break;
        }
        console.log('[RouteLab] Run simulation:', algoKey);
    }

    function resetSimulation(algoKey) {
        var info = ALGO_MAP[algoKey];
        if (!info) return;
        var panel = document.getElementById(info.panelId);
        if (panel) panel.innerHTML = '<p class="results-placeholder">Results will appear here after running the simulation.</p>';
        clearViz(info.vizId);
        clearAllAlgoHighlights();
        console.log('[RouteLab] Reset:', algoKey);
    }

    /* ===== Multicast Options ===== */

    function updateMulticastOptions() {
        var sel = document.getElementById('multicastGroupSelect');
        if (!sel) return;
        var graph = RouteLab.Network.getGraphData();
        var saved = [];
        for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].selected) saved.push(sel.options[i].value);
        }
        sel.innerHTML = '';
        if (graph && graph.nodes) {
            graph.nodes.forEach(function (n) {
                var opt = document.createElement('option');
                opt.value = n.id; opt.textContent = n.id;
                if (saved.indexOf(n.id) !== -1) opt.selected = true;
                sel.appendChild(opt);
            });
        }
    }

    /* ===== Public API ===== */

    window.runAlgorithm = runSimulation;
    window.resetAlgorithm = resetSimulation;

    return {
        runSimulation: runSimulation,
        resetSimulation: resetSimulation,
        updateMulticastOptions: updateMulticastOptions
    };
})();

console.log('[RouteLab-Simple] Algorithms module loaded.');
