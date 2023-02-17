var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// First, we need to represent our problem as a graph. To do this, we'll consider
// a three-dimensional space where each point is a node in the graph. 
// We'll connect two nodes if they are adjacent in the space.
// The cost of an edge between two nodes will be the Euclidean distance between them.
class Graph {
  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(node) {
    this.nodes.add(node);
    this.edges.set(node, new Set());
  }

  addEdge(node1, node2, cost) {
    this.edges.get(node1).add({node: node2, cost});
    this.edges.get(node2).add({node: node1, cost});
  }

  hasEdge(node1, node2) {
    if (!this.edges.has(node1) || !this.edges.has(node2)) {
      return false;
    }
    return this.edges.get(node1).has(node2);
  }

  getNeighbors(node) {
    return Array.from(this.edges.get(node)).map(edge => edge.node);
  }

  getCost(node1, node2) {
    return Array.from(this.edges.get(node1)).find(edge => edge.node === node2).cost;
  }
}



// class PriorityQueue {
//   constructor() {
//     this.elements = [];
//   }

//   enqueue(element, priority) {
//     this.elements.push({element, priority});
//     this.elements.sort((a, b) => a.priority - b.priority);
//   }

//   dequeue() {
//     return this.elements.shift().element;
//   }

//   isEmpty() {
//     return this.elements.length === 0;
//   }
// }
class PriorityQueue {
  constructor() {
    this.elements = [];
  }

  isEmpty() {
    return this.elements.length === 0;
  }

  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.heapifyUp();
  }

  dequeue() {
    const min = this.elements[0];
    const last = this.elements.pop();
    if (!this.isEmpty()) {
      this.elements[0] = last;
      this.heapifyDown();
    }
    return min.element;
  }

  heapifyUp() {
    let index = this.elements.length - 1;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.elements[parentIndex].priority <= this.elements[index].priority) {
        break;
      }
      this.swap(parentIndex, index);
      index = parentIndex;
    }
  }

  heapifyDown() {
    let index = 0;
    while (index < this.elements.length) {
      const leftChildIndex = index * 2 + 1;
      const rightChildIndex = index * 2 + 2;
      let smallerChildIndex = null;
      if (leftChildIndex < this.elements.length) {
        smallerChildIndex = leftChildIndex;
      }
      if (rightChildIndex < this.elements.length && this.elements[rightChildIndex].priority < this.elements[leftChildIndex].priority) {
        smallerChildIndex = rightChildIndex;
      }
      if (smallerChildIndex === null || this.elements[smallerChildIndex].priority >= this.elements[index].priority) {
        break;
      }
      this.swap(smallerChildIndex, index);
      index = smallerChildIndex;
    }
  }

  swap(index1, index2) {
    const temp = this.elements[index1];
    this.elements[index1] = this.elements[index2];
    this.elements[index2] = temp;
  }
}


function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

function astar(start, goal, graph) {
  const frontier = new PriorityQueue();
  frontier.enqueue(start, 0);

  const cameFrom = new Map();
  const costSoFar = new Map();
  cameFrom.set(start, null);
  costSoFar.set(start, 0);

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue();

    if (current === goal) {
      break;
    }

    for (const neighbor of graph.getNeighbors(current)) {
      const newCost = costSoFar.get(current) + graph.getCost(current, neighbor);
      if (!costSoFar.has(neighbor) || newCost < costSoFar.get(neighbor)) {
        costSoFar.set(neighbor, newCost);
        const priority = newCost + heuristic(neighbor, goal);
        frontier.enqueue(neighbor, priority);
        cameFrom.set(neighbor, current);
      }
    }
  }

  return {cameFrom, costSoFar};
}





// Define the nodes and edges of the graph
// const graph = new Graph();
// const node1 = {x: 1, y: 2, z: 3};
// const node2 = {x: 4, y: 5, z: 6};
// const node3 = {x: 7, y: 8, z: 9};
// graph.addNode(node1);
// graph.addNode(node2);
// graph.addNode(node3);
// graph.addEdge(node1, node2, 10);
// graph.addEdge(node2, node3, 20);
// graph.addEdge(node1, node3, 30);

// // Find the shortest path from node1 to node3
// const {cameFrom, costSoFar} = astar(node1, node3, graph);

// // Print the path and total cost
// const nav_path = [node3];
// let current = node3;
// while (current !== node1) {
//   current = cameFrom.get(current);
//   nav_path.unshift(current);
// }
// console.log(`Shortest path: ${nav_path.map(node => `(${node.x},${node.y},${node.z})`).join(' -> ')}`);
// console.log(`Total cost: ${costSoFar.get(node3)}`);
//Shortest path: (1,2,3) -> (7,8,9)
//Total cost: 30



function generateRandomGraph(numNodes, numEdges) {
  const graph = new Graph();
  const nodes = [];
  // Add nodes to the graph
  for (let i = 0; i < numNodes; i++) {
    const node = {x: Math.random(), y: Math.random(), z: Math.random()};
    nodes.push(node);
    graph.addNode(node);
  }
  // Add edges to the graph
  for (let i = 0; i < numEdges; i++) {
    const node1 = nodes[Math.floor(Math.random() * numNodes)];
    const node2 = nodes[Math.floor(Math.random() * numNodes)];
    if (node1 !== node2 && !graph.hasEdge(node1, node2)) {
      const cost = Math.random() * 100;
      graph.addEdge(node1, node2, cost);
    }
  }
  return graph;
}

function generateRandomStartAndGoal(graph) {
  const nodes = Array.from(graph.nodes);
  const start = nodes[Math.floor(Math.random() * nodes.length)];
  let goal = nodes[Math.floor(Math.random() * nodes.length)];
  while (goal === start || !graph.nodes.has(goal)) {
    goal = nodes[Math.floor(Math.random() * nodes.length)];
  }
  return {start, goal};
}

function getPath(cameFrom, start, goal) {
  const path = [goal];
  let current = goal;
  while (current !== start) {
    current = cameFrom.get(current);
    path.unshift(current);
  }
  return path;
}

const graph = generateRandomGraph(100, 500);
const {start, goal} = generateRandomStartAndGoal(graph);
const {cameFrom, costSoFar} = astar(start, goal, graph);

console.log(`Shortest path: ${getPath(cameFrom, start, goal).map(node => `(${node.x},${node.y},${node.z})`).join(' -> ')}`);
console.log(`Total cost: ${costSoFar.get(goal)}`);
// Shortest path: (0.9999763560353352,0.4508237806138078,0.5894754056076206) -> (0.07781692309794219,0.6297665053216013,0.6047373004328658) -> (0.6301678070983603,0.1384105349420255,0.4547187044886618) -> (0.5247900389173077,0.5468465027227152,0.560167135091616) -> (0.9775132575658472,0.8239228846332252,0.9578454335707871) -> (0.16111972948158826,0.19287005269912916,0.6670053837007921) -> (0.3410286562771774,0.295247230455149,0.4811201579619486)
// Total cost: 66.7479753827385


module.exports = app;
