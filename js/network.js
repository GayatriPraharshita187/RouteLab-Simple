/* ============================================
   RouteLab-Simple | network.js
   Cytoscape.js network builder logic
   ============================================ */

var RouteLab = RouteLab || {};

RouteLab.Network = (function () {
    'use strict';

    var cy = null;
    var routerCount = 0;
    var connectMode = false;
    var connectSource = null;
    var canvasHint = null;
    var deleteRouterMode = false;
    var deleteLinkMode = false;
    var editCostMode = false;

    /* ---------- Cytoscape style configuration ---------- */
    var CY_STYLE = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'background-color': '#4A9EFF',
                'color': '#E6EDF3',
                'font-size': '14px',
                'font-weight': '600',
                'width': '44px',
                'height': '44px',
                'border-width': '2px',
                'border-color': '#2D6BB8'
            }
        },
        {
            selector: 'node:selected',
            style: {
                'background-color': '#00D4FF',
                'border-color': '#00D4FF',
                'border-width': '3px'
            }
        },
        /* Algorithm area coloring (low priority, overridden by highlights) */
        {
            selector: '.algo-area-a',
            style: { 'background-color': '#8957E5', 'border-color': '#8957E5' }
        },
        {
            selector: '.algo-area-b',
            style: { 'background-color': '#238636', 'border-color': '#238636' }
        },
        {
            selector: '.algo-area-c',
            style: { 'background-color': '#DB61A2', 'border-color': '#DB61A2' }
        },
        {
            selector: '.algo-area-d',
            style: { 'background-color': '#F0883E', 'border-color': '#F0883E' }
        },
        {
            selector: '.connect-source',
            style: {
                'background-color': '#3FB950',
                'border-color': '#3FB950'
            }
        },
        {
            selector: '.source-node',
            style: {
                'background-color': '#00D4FF',
                'border-color': '#00D4FF',
                'border-width': '4px'
            }
        },
        {
            selector: '.dest-node',
            style: {
                'background-color': '#D29922',
                'border-color': '#D29922',
                'border-width': '4px'
            }
        },
        {
            selector: '.algo-visited',
            style: {
                'background-color': '#58A6FF',
                'border-color': '#58A6FF',
                'border-width': '3px'
            }
        },
        {
            selector: '.highlighted',
            style: {
                'background-color': '#3FB950',
                'border-color': '#3FB950',
                'border-width': '3px'
            },
        },
        {
            selector: '.algo-member',
            style: {
                'border-color': '#E3B341',
                'border-width': '6px'
            }
        },
        {
            selector: '.algo-unreachable',
            style: {
                'background-color': '#F85149',
                'border-color': '#F85149'
            }
        },
        {
            selector: 'edge',
            style: {
                'label': 'data(label)',
                'text-rotation': 'autorotate',
                'text-background-color': '#0D1117',
                'text-background-padding': '3px',
                'text-background-opacity': '0.8',
                'color': '#8B98A8',
                'font-size': '11px',
                'width': '2px',
                'line-color': '#2D3540',
                'target-arrow-color': '#2D3540',
                'source-arrow-color': '#2D3540',
                'curve-style': 'bezier',
                'arrow-scale': 0.8
            }
        },
        {
            selector: 'edge.algo-flood',
            style: {
                'line-color': '#58A6FF',
                'target-arrow-color': '#58A6FF',
                'source-arrow-color': '#58A6FF',
                'width': '3px'
            }
        },
        {
            selector: 'edge.highlighted',
            style: {
                'line-color': '#3FB950',
                'target-arrow-color': '#3FB950',
                'source-arrow-color': '#3FB950',
                'width': '4px',
                'color': '#3FB950'
            }
        },
        {
            selector: 'edge.unavailable',
            style: {
                'line-color': '#F85149',
                'target-arrow-color': '#F85149',
                'source-arrow-color': '#F85149'
            }
        }
    ];

    /* ---------- Sample networks ---------- */
    var SAMPLE_NETWORKS = {
        linear: {
            name: 'Linear Chain',
            nodes: [
                { id: 'R1', label: 'R1', pos: { x: 100, y: 250 } },
                { id: 'R2', label: 'R2', pos: { x: 300, y: 250 } },
                { id: 'R3', label: 'R3', pos: { x: 500, y: 250 } },
                { id: 'R4', label: 'R4', pos: { x: 700, y: 250 } },
                { id: 'R5', label: 'R5', pos: { x: 900, y: 250 } }
            ],
            edges: [
                { source: 'R1', target: 'R2', cost: 4 },
                { source: 'R2', target: 'R3', cost: 2 },
                { source: 'R3', target: 'R4', cost: 5 },
                { source: 'R4', target: 'R5', cost: 3 }
            ]
        },
        mesh: {
            name: 'Mesh Network',
            nodes: [
                { id: 'R1', label: 'R1', pos: { x: 200, y: 100 } },
                { id: 'R2', label: 'R2', pos: { x: 600, y: 100 } },
                { id: 'R3', label: 'R3', pos: { x: 800, y: 350 } },
                { id: 'R4', label: 'R4', pos: { x: 500, y: 500 } },
                { id: 'R5', label: 'R5', pos: { x: 200, y: 400 } },
                { id: 'R6', label: 'R6', pos: { x: 400, y: 280 } }
            ],
            edges: [
                { source: 'R1', target: 'R2', cost: 3 },
                { source: 'R1', target: 'R5', cost: 4 },
                { source: 'R1', target: 'R6', cost: 2 },
                { source: 'R2', target: 'R3', cost: 5 },
                { source: 'R2', target: 'R6', cost: 1 },
                { source: 'R3', target: 'R4', cost: 3 },
                { source: 'R3', target: 'R6', cost: 6 },
                { source: 'R4', target: 'R5', cost: 2 },
                { source: 'R4', target: 'R6', cost: 4 },
                { source: 'R5', target: 'R6', cost: 3 }
            ]
        },
        star: {
            name: 'Star Topology',
            nodes: [
                { id: 'R1', label: 'R1 (Hub)', pos: { x: 450, y: 250 } },
                { id: 'R2', label: 'R2', pos: { x: 450, y: 80 } },
                { id: 'R3', label: 'R3', pos: { x: 700, y: 250 } },
                { id: 'R4', label: 'R4', pos: { x: 450, y: 420 } },
                { id: 'R5', label: 'R5', pos: { x: 200, y: 250 } }
            ],
            edges: [
                { source: 'R1', target: 'R2', cost: 1 },
                { source: 'R1', target: 'R3', cost: 1 },
                { source: 'R1', target: 'R4', cost: 1 },
                { source: 'R1', target: 'R5', cost: 1 }
            ]
        },
        ring: {
            name: 'Ring Topology',
            nodes: [
                { id: 'R1', label: 'R1', pos: { x: 450, y: 80 } },
                { id: 'R2', label: 'R2', pos: { x: 750, y: 180 } },
                { id: 'R3', label: 'R3', pos: { x: 750, y: 380 } },
                { id: 'R4', label: 'R4', pos: { x: 450, y: 480 } },
                { id: 'R5', label: 'R5', pos: { x: 150, y: 380 } },
                { id: 'R6', label: 'R6', pos: { x: 150, y: 180 } }
            ],
            edges: [
                { source: 'R1', target: 'R2', cost: 2 },
                { source: 'R2', target: 'R3', cost: 3 },
                { source: 'R3', target: 'R4', cost: 2 },
                { source: 'R4', target: 'R5', cost: 4 },
                { source: 'R5', target: 'R6', cost: 2 },
                { source: 'R6', target: 'R1', cost: 3 }
            ]
        },
        hierarchical: {
            name: 'Hierarchical',
            nodes: [
                { id: 'R1', label: 'R1 (Core)', pos: { x: 450, y: 80 } },
                { id: 'R2', label: 'R2', pos: { x: 200, y: 220 } },
                { id: 'R3', label: 'R3', pos: { x: 700, y: 220 } },
                { id: 'R4', label: 'R4', pos: { x: 80, y: 380 } },
                { id: 'R5', label: 'R5', pos: { x: 280, y: 380 } },
                { id: 'R6', label: 'R6', pos: { x: 600, y: 380 } },
                { id: 'R7', label: 'R7', pos: { x: 800, y: 380 } },
                { id: 'R8', label: 'R8', pos: { x: 450, y: 480 } }
            ],
            edges: [
                { source: 'R1', target: 'R2', cost: 1 },
                { source: 'R1', target: 'R3', cost: 1 },
                { source: 'R2', target: 'R4', cost: 2 },
                { source: 'R2', target: 'R5', cost: 2 },
                { source: 'R3', target: 'R6', cost: 3 },
                { source: 'R3', target: 'R7', cost: 2 },
                { source: 'R5', target: 'R8', cost: 4 },
                { source: 'R6', target: 'R8', cost: 3 }
            ]
        }
    };

    /* ---------- Initialize Cytoscape instance ---------- */
    function init() {
        var canvasEl = document.getElementById('cyCanvas');
        canvasHint = document.getElementById('canvasHint');

        cy = cytoscape({
            container: canvasEl,
            elements: [],
            style: CY_STYLE,
            layout: { name: 'preset' },
            wheelSensitivity: 0.3,
            minZoom: 0.3,
            maxZoom: 3
        });

        /* Tap handler for nodes */
        cy.on('tap', 'node', function (evt) {
            var node = evt.target;

            /* Delete router mode */
            if (deleteRouterMode) {
                deleteRouter(node.id());
                return;
            }

            /* Connect mode */
            if (!connectMode) return;

            if (!connectSource) {
                connectSource = node;
                node.addClass('connect-source');
                updateHint('Select the destination router to connect.');
            } else {
                if (node.id() === connectSource.id()) {
                    connectSource.removeClass('connect-source');
                    connectSource = null;
                    updateHint('Select the first router to connect.');
                    return;
                }

                var cost = parseInt(document.getElementById('linkCostInput').value, 10);
                if (isNaN(cost) || cost < 1) cost = 1;

                addEdge(connectSource.id(), node.id(), cost);

                connectSource.removeClass('connect-source');
                connectSource = null;
                exitConnectMode();
            }
        });

        /* Tap handler for edges */
        cy.on('tap', 'edge', function (evt) {
            var edge = evt.target;

            /* Delete link mode */
            if (deleteLinkMode) {
                deleteLink(edge.id());
                return;
            }

            /* Edit cost mode */
            if (editCostMode) {
                editLinkCost(edge);
                return;
            }
        });

        /* Tap on empty canvas cancels current selection */
        cy.on('tap', function (evt) {
            if (evt.target === cy) {
                if (connectSource) {
                    connectSource.removeClass('connect-source');
                    connectSource = null;
                    if (connectMode) {
                        updateHint('Select the first router to connect.');
                    }
                }
            }
        });

        /* Hide hint when first element is added */
        cy.on('add', function () {
            if (cy.nodes().length > 0) {
                canvasHint.classList.add('hidden');
            }
        });

        bindControls();
        console.log('[RouteLab] Network builder initialized.');
    }

    /* ---------- Bind UI controls ---------- */
    function bindControls() {
        document.getElementById('btnAddRouter').addEventListener('click', addRouter);
        document.getElementById('btnConnectRouters').addEventListener('click', toggleConnectMode);
        document.getElementById('btnDeleteRouter').addEventListener('click', toggleDeleteRouterMode);
        document.getElementById('btnDeleteLink').addEventListener('click', toggleDeleteLinkMode);
        document.getElementById('btnEditCost').addEventListener('click', toggleEditCostMode);
        document.getElementById('btnFitView').addEventListener('click', fitToView);
        document.getElementById('btnResetNetwork').addEventListener('click', resetNetwork);
        document.getElementById('sampleNetworkSelect').addEventListener('change', loadSampleNetwork);
        document.getElementById('sourceRouterSelect').addEventListener('change', onSourceSelect);
        document.getElementById('destRouterSelect').addEventListener('change', onDestSelect);
    }

    /* ---------- Add a router ---------- */
    function addRouter() {
        routerCount++;
        var routerId = 'R' + routerCount;

        /* Place at a semi-random position near center */
        var offsetX = (Math.random() - 0.5) * 300;
        var offsetY = (Math.random() - 0.5) * 200;

        cy.add({
            group: 'nodes',
            data: { id: routerId, label: routerId },
            position: { x: 450 + offsetX, y: 250 + offsetY }
        });

        updateRouterSelectors();
        updateStats();
        console.log('[RouteLab] Added router:', routerId);
    }

    /* ---------- Toggle connect mode ---------- */
    function toggleConnectMode() {
        if (cy.nodes().length < 2) {
            updateHint('Add at least 2 routers before connecting.', true);
            return;
        }

        /* Exit other modes before entering connect mode */
        if (!connectMode) {
            clearAllModes();
        }

        connectMode = !connectMode;

        var btn = document.getElementById('btnConnectRouters');

        if (connectMode) {
            btn.textContent = 'Cancel Connect';
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-secondary');
            connectSource = null;
            updateHint('Click the first router to connect.');
        } else {
            exitConnectMode();
        }
    }

    function exitConnectMode() {
        connectMode = false;
        connectSource = null;
        cy.nodes().removeClass('connect-source');

        var btn = document.getElementById('btnConnectRouters');
        btn.textContent = 'Connect Routers';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-secondary');

        updateHint('Click "Add Router" to begin building your network. Use "Connect Routers" to link nodes.');
    }

    /* ---------- Clear all interaction modes ---------- */
    function clearAllModes() {
        /* Connect mode */
        connectMode = false;
        connectSource = null;
        cy.nodes().removeClass('connect-source');
        var connBtn = document.getElementById('btnConnectRouters');
        if (connBtn) {
            connBtn.textContent = 'Connect Routers';
            connBtn.classList.remove('btn-danger');
            connBtn.classList.add('btn-secondary');
        }

        /* Delete router mode */
        deleteRouterMode = false;
        var delRtrBtn = document.getElementById('btnDeleteRouter');
        if (delRtrBtn) {
            delRtrBtn.textContent = 'Delete Router';
            delRtrBtn.classList.remove('btn-danger');
            delRtrBtn.classList.add('btn-secondary');
        }

        /* Delete link mode */
        deleteLinkMode = false;
        var delLnkBtn = document.getElementById('btnDeleteLink');
        if (delLnkBtn) {
            delLnkBtn.textContent = 'Delete Link';
            delLnkBtn.classList.remove('btn-danger');
            delLnkBtn.classList.add('btn-secondary');
        }

        /* Edit cost mode */
        editCostMode = false;
        var editBtn = document.getElementById('btnEditCost');
        if (editBtn) {
            editBtn.textContent = 'Edit Link Cost';
            editBtn.classList.remove('btn-danger');
            editBtn.classList.add('btn-secondary');
        }
    }

    /* ---------- Toggle delete router mode ---------- */
    function toggleDeleteRouterMode() {
        if (cy.nodes().length === 0) {
            updateHint('No routers to delete.', true);
            return;
        }

        if (!deleteRouterMode) {
            clearAllModes();
        }

        deleteRouterMode = !deleteRouterMode;

        var btn = document.getElementById('btnDeleteRouter');

        if (deleteRouterMode) {
            btn.textContent = 'Cancel Delete';
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-secondary');
            updateHint('Click a router to delete it and all its links.');
        } else {
            btn.textContent = 'Delete Router';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            updateHint('Delete router mode cancelled.');
        }
    }

    /* ---------- Toggle delete link mode ---------- */
    function toggleDeleteLinkMode() {
        if (cy.edges().length === 0) {
            updateHint('No links to delete.', true);
            return;
        }

        if (!deleteLinkMode) {
            clearAllModes();
        }

        deleteLinkMode = !deleteLinkMode;

        var btn = document.getElementById('btnDeleteLink');

        if (deleteLinkMode) {
            btn.textContent = 'Cancel Delete';
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-secondary');
            updateHint('Click a link to delete it.');
        } else {
            btn.textContent = 'Delete Link';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            updateHint('Delete link mode cancelled.');
        }
    }

    /* ---------- Toggle edit cost mode ---------- */
    function toggleEditCostMode() {
        if (cy.edges().length === 0) {
            updateHint('No links to edit.', true);
            return;
        }

        if (!editCostMode) {
            clearAllModes();
        }

        editCostMode = !editCostMode;

        var btn = document.getElementById('btnEditCost');

        if (editCostMode) {
            btn.textContent = 'Cancel Edit';
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-secondary');
            updateHint('Click a link to apply the cost from the Link Cost input.');
        } else {
            btn.textContent = 'Edit Link Cost';
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-secondary');
            updateHint('Edit cost mode cancelled.');
        }
    }

    /* ---------- Delete a router ---------- */
    function deleteRouter(routerId) {
        var node = cy.getElementById(routerId);
        if (node.empty()) return;

        /* If this router was source or dest, clear the selection */
        var sourceSelect = document.getElementById('sourceRouterSelect');
        var destSelect = document.getElementById('destRouterSelect');

        if (sourceSelect.value === routerId) sourceSelect.value = '';
        if (destSelect.value === routerId) destSelect.value = '';

        /* Remove the node (edges connected to it are removed automatically by Cytoscape) */
        node.remove();

        updateRouterSelectors();
        updateSourceDestHighlight();
        updateStats();
        updateHint('Deleted router ' + routerId + ' and its links.');
        console.log('[RouteLab] Deleted router:', routerId);
    }

    /* ---------- Delete a link ---------- */
    function deleteLink(edgeId) {
        var edge = cy.getElementById(edgeId);
        if (edge.empty()) return;

        var sourceLabel = edge.data('source');
        var targetLabel = edge.data('target');

        edge.remove();

        updateStats();
        updateHint('Deleted link ' + sourceLabel + ' \u2014 ' + targetLabel + '.');
        console.log('[RouteLab] Deleted link:', edgeId);
    }

    /* ---------- Edit link cost ---------- */
    function editLinkCost(edge) {
        var newCost = parseInt(document.getElementById('linkCostInput').value, 10);
        if (isNaN(newCost) || newCost < 1) {
            updateHint('Enter a valid cost (1 or greater) in the Link Cost field, then click the link again.', true);
            return;
        }

        edge.data('cost', newCost);
        edge.data('label', String(newCost));

        updateStats();
        updateHint('Updated link ' + edge.data('source') + ' \u2014 ' + edge.data('target') + ' cost to ' + newCost + '.');

        /* Exit edit mode after successful edit */
        toggleEditCostMode();
        console.log('[RouteLab] Edited link cost:', edge.id(), 'to', newCost);
    }

    /* ---------- Fit graph to view ---------- */
    function fitToView() {
        if (cy.elements().length === 0) {
            updateHint('Network is empty. Add routers first.', true);
            return;
        }
        cy.animate({ fit: { eles: cy.elements(), padding: 50 }, duration: 300 });
        updateHint('Graph fitted to view.');
    }

    /* ---------- Update network stats display ---------- */
    function updateStats() {
        var statRouters = document.getElementById('statRouters');
        var statLinks = document.getElementById('statLinks');
        var statSource = document.getElementById('statSource');
        var statDest = document.getElementById('statDest');

        if (statRouters) statRouters.textContent = cy.nodes().length;
        if (statLinks) statLinks.textContent = cy.edges().length;

        var sourceVal = document.getElementById('sourceRouterSelect').value;
        var destVal = document.getElementById('destRouterSelect').value;

        if (statSource) statSource.textContent = sourceVal || 'None';
        if (statDest) statDest.textContent = destVal || 'None';
    }

    /* ---------- Source/destination selection handlers ---------- */
    function onSourceSelect() {
        updateSourceDestHighlight();
        updateStats();
    }

    function onDestSelect() {
        updateSourceDestHighlight();
        updateStats();
    }

    /* ---------- Highlight source/dest nodes on canvas ---------- */
    function updateSourceDestHighlight() {
        cy.nodes().removeClass('source-node dest-node');

        var sourceId = document.getElementById('sourceRouterSelect').value;
        var destId = document.getElementById('destRouterSelect').value;

        if (sourceId && cy.getElementById(sourceId).nonempty()) {
            cy.getElementById(sourceId).addClass('source-node');
        }
        if (destId && cy.getElementById(destId).nonempty()) {
            cy.getElementById(destId).addClass('dest-node');
        }
    }

    /* ---------- Add an edge between two routers ---------- */
    function addEdge(sourceId, targetId, cost) {
        var edgeId = sourceId + '-' + targetId;
        var reverseId = targetId + '-' + sourceId;

        /* Avoid duplicates */
        if (cy.getElementById(edgeId).nonempty() || cy.getElementById(reverseId).nonempty()) {
            updateHint('Link already exists between ' + sourceId + ' and ' + targetId + '.', true);
            return;
        }

        cy.add({
            group: 'edges',
            data: {
                id: edgeId,
                source: sourceId,
                target: targetId,
                label: String(cost),
                cost: cost
            }
        });

        updateHint('Connected ' + sourceId + ' to ' + targetId + ' (cost: ' + cost + ').');
        updateStats();
        console.log('[RouteLab] Added edge:', edgeId, 'cost:', cost);
    }

    /* ---------- Update source/destination selectors ---------- */
    function updateRouterSelectors() {
        var sourceSelect = document.getElementById('sourceRouterSelect');
        var destSelect = document.getElementById('destRouterSelect');

        var nodes = cy.nodes();
        var sourceVal = sourceSelect.value;
        var destVal = destSelect.value;

        /* Clear existing options (keep placeholder) */
        sourceSelect.innerHTML = '<option value="">-- Select --</option>';
        destSelect.innerHTML = '<option value="">-- Select --</option>';

        nodes.forEach(function (n) {
            var opt1 = document.createElement('option');
            opt1.value = n.id();
            opt1.textContent = n.data('label');
            sourceSelect.appendChild(opt1);

            var opt2 = document.createElement('option');
            opt2.value = n.id();
            opt2.textContent = n.data('label');
            destSelect.appendChild(opt2);
        });

        /* Restore selections if they still exist */
        if (cy.getElementById(sourceVal).nonempty()) sourceSelect.value = sourceVal;
        if (cy.getElementById(destVal).nonempty()) destSelect.value = destVal;

        updateSourceDestHighlight();
        updateStats();
        if (RouteLab.Algorithms && RouteLab.Algorithms.updateMulticastOptions) {
            RouteLab.Algorithms.updateMulticastOptions();
        }
    }

    /* ---------- Load a sample network ---------- */
    function loadSampleNetwork() {
        var key = document.getElementById('sampleNetworkSelect').value;
        if (!key || !SAMPLE_NETWORKS[key]) return;

        var sample = SAMPLE_NETWORKS[key];

        /* Clear current network and all interaction modes */
        clearAllModes();
        cy.elements().remove();

        /* Add nodes */
        sample.nodes.forEach(function (n) {
            cy.add({
                group: 'nodes',
                data: { id: n.id, label: n.label },
                position: n.pos
            });
        });

        /* Add edges */
        sample.edges.forEach(function (e) {
            var edgeId = e.source + '-' + e.target;
            cy.add({
                group: 'edges',
                data: {
                    id: edgeId,
                    source: e.source,
                    target: e.target,
                    label: String(e.cost),
                    cost: e.cost
                }
            });
        });

        routerCount = sample.nodes.length;

        /* Update next router counter to avoid ID conflicts */
        var maxNum = 0;
        sample.nodes.forEach(function (n) {
            var num = parseInt(n.id.replace('R', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        });
        routerCount = maxNum;

        updateRouterSelectors();

        /* Reset sample selector */
        document.getElementById('sampleNetworkSelect').value = '';

        canvasHint.classList.add('hidden');
        updateHint('Loaded sample: ' + sample.name + ' (' + sample.nodes.length + ' routers, ' + sample.edges.length + ' links).');
        console.log('[RouteLab] Loaded sample network:', key);
    }

    /* ---------- Reset network ---------- */
    function resetNetwork() {
        cy.elements().remove();
        routerCount = 0;
        clearAllModes();

        /* Clear source/dest selections and highlights */
        document.getElementById('sourceRouterSelect').value = '';
        document.getElementById('destRouterSelect').value = '';

        updateRouterSelectors();
        canvasHint.classList.remove('hidden');
        canvasHint.textContent = 'Click "Add Router" to begin building your network. Use "Connect Routers" to link nodes.';
        updateStats();
        console.log('[RouteLab] Network reset.');
    }

    /* ---------- Update hint text ---------- */
    function updateHint(text, isError) {
        canvasHint.textContent = text;
        canvasHint.style.color = isError ? '#F85149' : '#5C6573';
    }

    /* ---------- Public API ---------- */
    return {
        init: init,
        getCy: function () { return cy; },
        resetNetwork: resetNetwork,
        loadSampleNetwork: loadSampleNetwork,
        updateRouterSelectors: updateRouterSelectors,
        getSelectedSource: function () {
            return document.getElementById('sourceRouterSelect').value;
        },
        getSelectedDest: function () {
            return document.getElementById('destRouterSelect').value;
        },
        highlightPath: function (nodeIds, edgeIds) {
            cy.nodes().removeClass('highlighted');
            cy.edges().removeClass('highlighted');
            nodeIds.forEach(function (id) { cy.getElementById(id).addClass('highlighted'); });
            edgeIds.forEach(function (id) { cy.getElementById(id).addClass('highlighted'); });
        },
        clearHighlights: function () {
            cy.nodes().removeClass('highlighted');
            cy.edges().removeClass('highlighted');
            cy.nodes().removeClass('connect-source');
        },
        addClassToElements: function (nodeIds, edgeIds, className) {
            if (nodeIds) {
                nodeIds.forEach(function (id) {
                    var el = cy.getElementById(id);
                    if (el.nonempty() && el.isNode()) el.addClass(className);
                });
            }
            if (edgeIds) {
                edgeIds.forEach(function (id) {
                    var el = cy.getElementById(id);
                    if (el.nonempty() && el.isEdge()) el.addClass(className);
                });
            }
        },
        clearAlgoClasses: function () {
            cy.nodes().removeClass('highlighted algo-visited algo-member algo-unreachable algo-area-a algo-area-b algo-area-c algo-area-d');
            cy.edges().removeClass('highlighted algo-flood');
            cy.nodes().removeClass('connect-source');
        },
        getGraphData: function () {
            var nodes = [];
            var edges = [];
            cy.nodes().forEach(function (n) {
                nodes.push({ id: n.id(), label: n.data('label') });
            });
            cy.edges().forEach(function (e) {
                edges.push({
                    source: e.data('source'),
                    target: e.data('target'),
                    cost: e.data('cost')
                });
            });
            return { nodes: nodes, edges: edges };
        }
    };
})();

/* Initialize when DOM is ready */
document.addEventListener('DOMContentLoaded', function () {
    RouteLab.Network.init();
});
