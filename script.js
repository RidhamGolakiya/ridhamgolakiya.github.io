var Painter = (function () {

    Painter = function () {
        this.canvas = arguments[0]['canvas'] || document.getElementById("bg-canvas");
        this.ctx = this.canvas.getContext('2d');
        this.ctx.globalAlpha = arguments[0]['globalAlpha'] || 1;
        this.star = arguments[0]['star'] || new Array(10);
        this.w = arguments[0]['w'] || 400;
        this.h = arguments[0]['h'] || 400;
    };

    Painter.prototype = {
        constructor: Painter,

        // byte saving technic
        generate: function (g, b, i) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

            var g, b,
                i = this.star.length;

            for (; i--;) {
                this.star[i] = new Array(7);
                this.star[i][0] = Math.random() * this.w;
                this.star[i][1] = Math.random() * this.h;
                this.star[i][2] = Math.random() * this.w / 3 + this.w / 14;

                g = Math.random() * 100 * 0;
                b = Math.random() * 200 * 0;

                this.star[i][4] = 0;
                this.star[i][5] = Math.ceil(g);
                this.star[i][6] = Math.ceil(b);
            }

            return this;
        },
        reset: function () {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.fillStyle = "rgba(0, 0, 0, 0)";
            this.ctx.fillRect(0, 0, this.w, this.h);

            return this;
        },
        paint: function (edgecolor1, edgecolor2, edgecolor3, edgecolor4, gradblur, i) {

            this.ctx.globalCompositeOperation = "lighter";
            var i = this.star.length;

            for (; i--;) {
                this.ctx.beginPath();

                edgecolor1 = "rgba(" + this.star[i][4] + "," + this.star[i][5] + "," + this.star[i][6] + ",0.5)";
                edgecolor2 = "rgba(" + this.star[i][4] + "," + this.star[i][5] + "," + this.star[i][6] + ",0.3)";
                edgecolor3 = "rgba(" + this.star[i][4] + "," + this.star[i][5] + "," + this.star[i][6] + ",0.1)";
                edgecolor4 = "rgba(" + this.star[i][4] + "," + this.star[i][5] + "," + this.star[i][6] + ",0)";

                gradblur = this.ctx.createRadialGradient(this.star[i][0], this.star[i][1], 0, this.star[i][0], this.star[i][1], this.star[i][2]);

                gradblur.addColorStop(0, edgecolor1)
                gradblur.addColorStop(0.4, edgecolor1);
                gradblur.addColorStop(0.7, edgecolor2);
                gradblur.addColorStop(0.9, edgecolor3);
                gradblur.addColorStop(1, edgecolor4);

                this.ctx.fillStyle = gradblur;
                this.ctx.arc(this.star[i][0], this.star[i][1], this.star[i][2], 0, Math.PI * 2, false);
                this.ctx.fill();
            }
        }
    };
    return Painter;
})();

new Painter({
    globalAlpha: 0.1
}).generate().reset().paint();

var Boid = function () {

    var vector = new THREE.Vector3(),
        acceleration, width = 500,
        height = 500,
        depth = 200,
        goal, neighborhoodRadius = 100,
        maxSpeed = 4,
        maxSteerForce = 0.1,
        avoidWalls = false;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    acceleration = new THREE.Vector3();

    this.setGoal = function (target) {
        goal = target;
    }

    this.setAvoidWalls = function (value) {
        avoidWalls = value;
    }

    this.setWorldSize = function (width, height, depth) {
        width = width;
        height = height;
        depth = depth;
    }

    this.run = function (boids) {

        if (avoidWalls) {

            vector.set(-width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

            vector.set(width, this.position.y, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

            vector.set(this.position.x, -height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

            vector.set(this.position.x, height, this.position.z);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

            vector.set(this.position.x, this.position.y, -depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

            vector.set(this.position.x, this.position.y, depth);
            vector = this.avoid(vector);
            vector.multiplyScalar(5);
            acceleration.addSelf(vector);

        }

        if (Math.random() > 0.5) {
            this.flock(boids);
        }

        this.move();
    }

    this.flock = function (boids) {

        if (goal) {
            acceleration.addSelf(this.reach(goal, 0.005));
        }

        acceleration.addSelf(this.alignment(boids));
        acceleration.addSelf(this.cohesion(boids));
        acceleration.addSelf(this.separation(boids));
    }

    this.move = function () {

        this.velocity.addSelf(acceleration);
        var l = this.velocity.length();
        if (l > maxSpeed) {
            this.velocity.divideScalar(l / maxSpeed);
        }

        this.position.addSelf(this.velocity);
        acceleration.set(0, 0, 0);
    }

    this.checkBounds = function () {
        if (this.position.x > width) this.position.x = -width;
        if (this.position.x < -width) this.position.x = width;
        if (this.position.y > height) this.position.y = -height;
        if (this.position.y < -height) this.position.y = height;
        if (this.position.z > depth) this.position.z = -depth;
        if (this.position.z < -depth) this.position.z = depth;
    }

    this.avoid = function (target) {
        var steer = new THREE.Vector3();
        steer.copy(this.position);
        steer.subSelf(target);
        steer.multiplyScalar(1 / this.position.distanceToSquared(target));
        return steer;
    }

    this.repulse = function (target) {
        var distance = this.position.distanceTo(target);
        if (distance < 150) {
            var steer = new THREE.Vector3();
            steer.sub(this.position, target);
            steer.multiplyScalar(0.5 / distance);
            acceleration.addSelf(steer);
        }
    }

    this.reach = function (target, amount) {
        var steer = new THREE.Vector3();
        steer.sub(target, this.position);
        steer.multiplyScalar(amount);
        return steer;
    }

    this.alignment = function (boids) {
        var boid, velSum = new THREE.Vector3(),
            count = 0;

        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);
            if (distance > 0 && distance <= neighborhoodRadius) {
                velSum.addSelf(boid.velocity);
                count++;
            }
        }

        if (count > 0) {
            velSum.divideScalar(count);
            var l = velSum.length();
            if (l > maxSteerForce) {
                velSum.divideScalar(l / maxSteerForce);
            }
        }

        return velSum;
    }

    this.cohesion = function (boids) {
        var boid, distance, posSum = new THREE.Vector3(),
            steer = new THREE.Vector3(),
            count = 0;

        for (var i = 0, il = boids.length; i < il; i++) {
            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);

            if (distance > 0 && distance <= neighborhoodRadius) {
                posSum.addSelf(boid.position);
                count++;
            }
        }

        if (count > 0) {
            posSum.divideScalar(count);
        }

        steer.sub(posSum, this.position);
        var l = steer.length();
        if (l > maxSteerForce) {
            steer.divideScalar(l / maxSteerForce);
        }

        return steer;
    }

    this.separation = function (boids) {
        var boid, distance, posSum = new THREE.Vector3(),
            repulse = new THREE.Vector3();

        for (var i = 0, il = boids.length; i < il; i++) {

            if (Math.random() > 0.6) continue;
            boid = boids[i];
            distance = boid.position.distanceTo(this.position);

            if (distance > 0 && distance <= neighborhoodRadius) {

                repulse.sub(this.position, boid.position);
                repulse.normalize();
                repulse.divideScalar(distance);
                posSum.addSelf(repulse);

            }
        }
        return posSum;
    }
}

var SCREENWIDTH = window.innerWidth,
    SCREENHEIGHT = window.innerHeight,
    SCREENWIDTHHALF = SCREENWIDTH / 2,
    SCREENHEIGHTHALF = SCREENHEIGHT / 2,

    camera, scene, renderer, birds, bird, boid, boids;

function init() {

    camera = new THREE.PerspectiveCamera(75, SCREENWIDTH / SCREENHEIGHT, 1, 10000);
    camera.position.z = 450;

    scene = new THREE.Scene();

    scene.add(camera);

    birds = [];
    boids = [];

    for (var i = 0; i < 200; i++) {

        boid = boids[i] = new Boid();
        boid.position.x = Math.random() * 400 - 200;
        boid.position.y = Math.random() * 400 - 200;
        boid.position.z = Math.random() * 400 - 200;
        boid.velocity.x = Math.random() * 2 - 1;
        boid.velocity.y = Math.random() * 2 - 1;
        boid.velocity.z = Math.random() * 2 - 1;
        boid.setAvoidWalls(true);
        boid.setWorldSize(500, 500, 400);

        bird = birds[i] = new THREE.Mesh(new Bird(), new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffffff
        }));
        bird.phase = Math.floor(Math.random() * 62.83);
        bird.position = boids[i].position;
        bird.doubleSided = true;
        // bird.scale.x = bird.scale.y = bird.scale.z = .7;
        scene.add(bird);
    }

    renderer = new THREE.CanvasRenderer();
    renderer.setSize(SCREENWIDTH, SCREENHEIGHT);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.body.appendChild(renderer.domElement);
}

function onDocumentMouseMove(event) {
    var vector = new THREE.Vector3(event.clientX - SCREENWIDTHHALF, -event.clientY + SCREENHEIGHTHALF, 0);

    for (var i = 0, il = boids.length; i < il; i++) {
        boid = boids[i];
        vector.z = boid.position.z;
        boid.repulse(vector);
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {

    for (var i = 0, il = birds.length; i < il; i++) {

        boid = boids[i];
        boid.run(boids);

        bird = birds[i];

        color = bird.material.color;
        color.r = color.g = color.b = (500 - bird.position.z) / 1000;

        bird.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x);
        bird.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length());

        bird.phase = (bird.phase + (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;
        bird.geometry.vertices[5].y = bird.geometry.vertices[4].y = Math.sin(bird.phase) * 5;

    }

    renderer.render(scene, camera);

}

init();
animate();
