let camera, scene, renderer, controls;
let then = 0;
var particleCount = 10;
var springCount = particleCount-1;
let particles = [];
var springs = [];
var positions = [];
let epsilon = 0.01;
var sphereRadius;
var lineGeometry, lineMaterial;



function init() {
	// Init scene
	scene = new THREE.Scene();

	// Init camera (PerspectiveCamera)
	camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	// Lights
  var light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set( 0, 60, 5 );
  light.rotation.x = -60 * Math.PI / 180;
  light.rotation.y = -20 * Math.PI / 180;
	var ambLight = new THREE.AmbientLight( 0x404040 ); // soft white light

	// Init renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });

	controls = new THREE.OrbitControls( camera, renderer.domElement );

	camera.position.set( 0, 30, 15 );
	camera.rotation.x = -45 * Math.PI / 180;
	controls.update();
	// Set size (whole window)
	renderer.setSize(window.innerWidth, window.innerHeight);

	sphereRadius = 4;
	var sphereGeometry = new THREE.SphereGeometry( sphereRadius, 32, 32 );
	var sphereMaterial = new THREE.MeshPhongMaterial( {color: 0xffff00} );
	sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	sphere.position.set(0.25,0,0);

	// Render to canvas element
	document.body.appendChild(renderer.domElement);
	spawnRope();

  scene.add(light, ambLight, sphere);
}

// Draw the scene every time the screen is refreshed
function animate(now) {
	now *= 0.0005;
	const delta = now - then;
	then = now;
	//console.log(first);

	for(var i = 1; i < particleCount; i++) {
		particles[i].forces.set(0, -9.82,0);
	}

	for (var i = 0; i < springCount; i++) {
		springs[i].calcForce();
	}

	for(var i = 0; i < particleCount; i++) {
		particles[i].prevState.position.copy(particles[i].curState.position);
		particles[i].prevState.velocity.copy(particles[i].curState.velocity);


		particles[i].curState.velocity = particles[i].prevState.velocity.clone().add(particles[i].forces.clone().multiplyScalar(delta/particles[i].mass));
		particles[i].curState.position = particles[i].prevState.position.clone().add(particles[i].curState.velocity.clone().multiplyScalar(delta));
		particles[i].mesh.position.set(particles[i].curState.position.x, particles[i].curState.position.y, particles[i].curState.position.z);

		var tempVec = new THREE.Vector3(0,0,0);
		tempVec = particles[i].curState.position.clone().sub(sphere.position);

		if(tempVec.dot(tempVec) <= sphereRadius*sphereRadius + 0.0001) {
			var v = new THREE.Vector3(0,0,0);
			v = particles[i].curState.position.clone().sub(particles[i].prevState.position);

			var tempVec2 = new THREE.Vector3(0,0,0);
			tempVec2 = particles[i].prevState.position.clone().sub(sphere.position);

			var alpha = v.dot(v);
			var beta = 2 * v.dot(tempVec);
			var gamma = sphere.position.dot(sphere.position) + particles[i].prevState.position.dot(particles[i].prevState.position) - 2 * particles[i].prevState.position.dot(sphere.position) - sphereRadius*sphereRadius;

			var lambda1 = (-beta + Math.sqrt(beta*beta-4*alpha*gamma))/(2*alpha);
			var lambda2 = (-beta - Math.sqrt(beta*beta-4*alpha*gamma))/(2*alpha);

			if(lambda1 > 0 && lambda1 < 1){
				if(lambda2 > 0 && lambda2 < 1 && lambda2 < lambda1){
					var lambda = lambda2;
				}
				else {
					var lambda = lambda1;
				}
			}
			else {
				var lambda = lambda2;
			}

			var collisionPoint = new THREE.Vector3(0,0,0);
			//collisionPoint = particles[i].curState.position.clone().add((particles[i].prevState.position.clone().sub(particles[i].curState.position)).multiplyScalar(lambda));
			collisionPoint = particles[i].curState.position.clone().add(v.multiplyScalar(lambda));

			var normal = new THREE.Vector3(collisionPoint.x - sphere.position.x,collisionPoint.y - sphere.position.y,collisionPoint.z - sphere.position.z);
			planeCollision(normal, collisionPoint, particles[i], delta);

		}
	}


	controls.update();

	requestAnimationFrame(animate);

	renderer.render(scene, camera);
}


var state = function(pos, vel) {
	this.position = pos;
	this.velocity = vel;
}
var particle = function(mass){

	particleRadius = 0.3;
	const particleGeometry = new THREE.SphereGeometry(particleRadius, 6, 6);
	const particleMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });

	this.curState = new state(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
	this.prevState = new state(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0));
	this.mass = mass;
	this.forces = new THREE.Vector3(0,0,0);
	this.mesh = new THREE.Mesh(particleGeometry, particleMaterial);
	}

	particle.prototype = {
		applyForce: function( force ) {
			this.forces.add(force);
		}
	}


var spring = function ( particle1, particle2) {
this.particle1 = particle1;
this.particle2 = particle2;
};

spring.prototype =  {
	calcForce: function() {
		 var ke = 40;
		 var kd = 0.9;
		 var springLen = 0.1;
		 var force = new THREE.Vector3(0,0,0);
		 var springVector = this.particle2.curState.position.clone().sub(this.particle1.curState.position);
		 var len = springVector.length();

		 if (len !== 0) {
			 springVector.normalize();
			 force.add(springVector.multiplyScalar(len - springLen).multiplyScalar(ke));
		}
		 //var temp1 = (len - springLen) * ke;
		 var newVel1 = this.particle1.curState.velocity.clone().sub(this.particle2.curState.velocity);
		 newVel1.multiplyScalar(-kd);
		 //var temp2 = newVel1.dot(springVector);
		 //var temp3 = temp1 + temp2;
		 //force.add(springVector.clone().multiplyScalar(temp3));
		 force.add(newVel1);

		if (this.particle1.head !== true) {
			this.particle1.applyForce(force);
		}
		this.particle2.applyForce(force.multiplyScalar(-1));
	}
}

function spawnRope() {
	var newGrav = new THREE.Vector3(0, 0, 0);
  for(var i = 0; i < particleCount; i++) {
			var tempParticle = new particle(0.05);
			particles[i] = tempParticle;
			if (i !== 0) {

					particles[i].applyForce(newGrav.clone().multiplyScalar(particles[i].mass));
					//particles[i].applyForce(newGrav.clone());
					}
					particles[i].curState.position.set(i/10,10,0);
					tempParticle.mesh.position.set(particles[i].curState.position.x,particles[i].curState.position.y,particles[i].curState.position.z);
		}
		//particles[9].forces.set(0,-9.82,0);
		particles[0].head = true;

		for(var i = 0; i < springCount; i++) {
			springs[i] = new spring(particles[i], particles[i+1]);
		}
		for(var i = 0; i < particleCount; i++) {
			scene.add(particles[i].mesh);
		}
  }

	function onWindowResize() {
		// Camera frustum aspect ratio
		camera.aspect = window.innerWidth / window.innerHeight;
		// After making changes to aspect
		camera.updateProjectionMatrix();
		// Reset size
		renderer.setSize(window.innerWidth, window.innerHeight);
	}
	function planeCollision(n, point, p, delta){
		n.normalize();
		var d = -point.dot(n);
		if(p.curState.position.dot(n) + d <= 0){

			var velocityDot = p.curState.velocity.dot(n);
			p.curState.velocity.sub(n.clone().multiplyScalar((1 + epsilon) * velocityDot));

			var positionDot = p.curState.position.dot(n);
			p.curState.position.sub(n.clone().multiplyScalar((1 + epsilon) * (positionDot + d)));

			var positionpDot = p.prevState.position.dot(n);
		 	p.prevState.position.sub(n.multiplyScalar((1 + epsilon) * (positionpDot + d)));

			//p.mesh.position.copy(p.curState.position);
		}
	}

	window.addEventListener('resize', onWindowResize, false);

	init();
	requestAnimationFrame(animate);
