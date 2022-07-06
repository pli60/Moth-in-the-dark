let flock;
let worldSeed;

function setup() {
  createCanvas(640, 360);

  flock = new Flock();
  // Add an initial set of boids into the system
  for (let i = 0; i < 20; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }
}

function draw() {
  background(51);

  fill(67, 142, 211);
  beginShape();
  vertex(45, height-45);
  vertex(width-45, height-45);
  vertex(width-45, 45);
  vertex(45, 45);
  endShape();

  flock.run();
  if (mouseIsPressed) {
    generateFire(mouseX, mouseY);
  }

  beginShape();
  fill('black');
  vertex(width / 2 - 5, height-45);
  vertex(width / 2 + 5, height-45);
  vertex(width / 2 + 5, 45);
  vertex(width / 2 - 5, 45);
  endShape();

  beginShape();
  fill('black');
  vertex(45, height / 2 - 5);
  vertex(width-45, height / 2 - 5);
  vertex(width-45, height / 2 + 5);
  vertex(45, height / 2 + 5);
  endShape();
}

function generateFire(mouseX, mouseY) {
  console.log(mouseX, mouseY);
  flock.addFire(new Fire(mouseX, mouseY));
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
  this.fire = null;
}

Flock.prototype.run = function() {
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids, this.fire);  // Passing the entire list of boids to each boid individually
  }
  if (this.fire) {
    this.fire.run();
  }
}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

Flock.prototype.addFire = function(f) {
  this.fire = f;
}

function Fire(x, y) {
  this.position = createVector(x, y);
  this.r = 3.0;
}

Fire.prototype.run = function() {
  this.render();
}


Fire.prototype.render = function() {
  push();
  fill(153, 153, 148);
  stroke(255);
  translate(this.position.x, this.position.y);
  scale(5);
  rotate(radians(180));
  beginShape()
  vertex(-1, 1.5);
  vertex(1, 1.5);
  vertex(0.5, -1.5);
  vertex(-0.5, -1.5);
  endShape(CLOSE);


  rectMode(CENTER);
  beginShape();
  fill(94, 94, 94);
  rect(0, 1, 1, 2);
  rect(0, -3, 0.05, 2.5);
  endShape(CLOSE);


  fill('red');
  stroke('red');
  beginShape();
  arc(0, 0, 0.5, 0.5, 0, 2 * PI);
  endShape(CLOSE);
  pop();
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 3;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function(boids, fire) {
  this.flock(boids, fire);
  this.update();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids, fire) {
  let sep = this.separate(boids);   // Separation
  // let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  let avo = this.avoid(boids);      // Avoid walls
  let cir = this.circle(boids, fire) // Circle around fire

  // Arbitrarily weight these forces
  sep.mult(10.0);
  // ali.mult(2.0);
  coh.mult(1.0);
  avo.mult(3.0);
  cir.mult(1.5);

  // Add the force vectors to acceleration
  this.applyForce(sep);
  // this.applyForce(ali);
  this.applyForce(coh);
  this.applyForce(avo);
  this.applyForce(cir);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90);
  fill(153, 153, 148);
  strokeWeight(2);
  stroke(200);

  push();
  translate(this.position.x, this.position.y);
  rotate(theta);

  scale(2);
  beginShape();
  vertex(0, 0);
  vertex(4, 3);
  vertex(4, -3);
  endShape(CLOSE);

  beginShape();
  vertex(0, 0);
  vertex(-4, 3);
  vertex(-4, -3);
  endShape(CLOSE);

  beginShape();
  vertex(-0.5, 1.5);
  vertex(0.5, 1.5);
  vertex(0.5, -1.5);
  endShape(CLOSE);

  fill('red');
  stroke('red');
  beginShape();
  ellipse(0, 0, 1, 5);
  endShape(CLOSE);
  pop();
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = 25.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}

Boid.prototype.avoid = function(boids) {
  let steer = createVector(0, 0);
  if (this.position.x <= 50) {
    steer.add(createVector(1, 0));
  }
  if (this.position.x > 590) { // width of canvas
    steer.add(createVector(-1, 0));
  }
  if (this.position.y <= 50) {
    steer.add(createVector(0, 1));
  }
  if (this.position.y > 310) { // height of canvas
    steer.add(createVector(0, -1));
  }
  return steer;
}

Boid.prototype.circle = function(boids, fire) {
  if (fire) {
    if (p5.Vector.dist(this.position, fire.position) > 80) {
      return this.seek(fire.position);
    } else {
      return this.align(boids);
    }
  } else {
    return createVector(0, 0);
  }
}
