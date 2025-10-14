const { createCanvas } = require('canvas');
const fs = require('fs');

// Canvas setup
const width = 400;
const height = 400;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Single color design - change logoColor to use on different backgrounds
const logoColor = '#000000'; // Black - can be changed for different backgrounds
const bgColor = 'transparent'; // Transparent background

// Fill background (transparent)
ctx.clearRect(0, 0, width, height);

// Define nodes in a circular feedback loop structure
const centerX = 200;
const centerY = 200;
const radius = 90;

// Create nodes in a circle (feedback loop)
const numNodes = 6;
const nodes = [];
for (let i = 0; i < numNodes; i++) {
  const angle = (i / numNodes) * Math.PI * 2 - Math.PI / 2; // Start from top
  nodes.push({
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
    size: 12 - (i % 2) * 2, // Vary sizes slightly
  });
}

// Create tree branches emanating from each of the 6 central nodes
const branchNodes = [];
const branchEdges = [];
const branchDepth = 3; // How many levels deep
const branchesPerNode = 2; // How many branches from each node

function createBranch(parentIndex, parentX, parentY, angle, depth, distance) {
  if (depth === 0) return;

  // Add some randomness to angle and distance
  const angleSpread = Math.PI / 4; // 45 degrees spread
  const distanceVariation = 0.8 + Math.random() * 0.4; // 80-120% of base distance

  const numBranches = branchesPerNode;
  for (let i = 0; i < numBranches; i++) {
    // Calculate branch angle with spread
    const branchAngle = angle + (i - (numBranches - 1) / 2) * angleSpread / (numBranches - 1);
    const branchDistance = distance * distanceVariation;

    const x = parentX + Math.cos(branchAngle) * branchDistance;
    const y = parentY + Math.sin(branchAngle) * branchDistance;

    // Keep within canvas bounds with margin
    const margin = 20;
    if (x < margin || x > width - margin || y < margin || y > height - margin) {
      continue;
    }

    // Create new node
    const nodeIndex = nodes.length;
    nodes.push({
      x,
      y,
      size: 3 - depth * 0.5, // Smaller as depth increases
    });

    // Create edge from parent to this node
    branchEdges.push([parentIndex, nodeIndex, false]);

    // Recurse to create more branches
    createBranch(nodeIndex, x, y, branchAngle, depth - 1, branchDistance * 0.7);
  }
}

// Create branches from each of the 6 central feedback loop nodes
for (let i = 0; i < numNodes; i++) {
  const node = nodes[i];
  // Calculate angle pointing outward from center
  const angleFromCenter = Math.atan2(node.y - centerY, node.x - centerX);

  // Create tree branch extending outward
  createBranch(i, node.x, node.y, angleFromCenter, branchDepth, 40);
}

// Define connections
const edges = [];

// Add all branch edges first (background)
edges.push(...branchEdges);

// Main circular feedback loop (with arrows) - drawn on top
for (let i = 0; i < numNodes; i++) {
  edges.push([i, (i + 1) % numNodes, true]); // true = show arrow
}

// Helper function to draw arrow
function drawArrow(fromX, fromY, toX, toY, showArrowhead = true) {
  // Calculate direction and shorten line to not overlap with nodes
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
  const nodeRadius = 12; // approximate

  // Shorten line from both ends
  const startX = fromX + Math.cos(angle) * (nodeRadius + 2);
  const startY = fromY + Math.sin(angle) * (nodeRadius + 2);
  const endX = toX - Math.cos(angle) * (nodeRadius + 8);
  const endY = toY - Math.sin(angle) * (nodeRadius + 8);

  ctx.strokeStyle = logoColor + 'CC'; // More opaque
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (showArrowhead) {
    // Draw arrowhead at the end point
    const arrowLength = 12;
    const arrowAngle = Math.PI / 5; // Wider arrow

    ctx.fillStyle = logoColor;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - arrowAngle),
      endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + arrowAngle),
      endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  }
}

// Draw edges - branches first (background), then feedback loop on top
edges.forEach(([i, j, showArrow]) => {
  const from = nodes[i];
  const to = nodes[j];

  // Make branch edges very subtle (background layer)
  const isBranchEdge = i >= numNodes || j >= numNodes;
  if (isBranchEdge) {
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 1.5;
  }

  drawArrow(from.x, from.y, to.x, to.y, showArrow || false);

  if (isBranchEdge) {
    ctx.globalAlpha = 1.0;
  }
});

// Draw nodes - mesh nodes first (subtle), then feedback loop nodes (prominent)
nodes.forEach((node, index) => {
  const isMeshNode = index >= numNodes;

  if (isMeshNode) {
    // Mesh nodes - very subtle
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = logoColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  } else {
    // Feedback loop nodes - prominent with glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = logoColor;
    ctx.fillStyle = logoColor;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fill();

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = logoColor + '40';
    ctx.beginPath();
    ctx.arc(node.x - node.size * 0.2, node.y - node.size * 0.2, node.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
});

// Save to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./logo.png', buffer);

console.log('Logo generated: logo.png (400x400)');
