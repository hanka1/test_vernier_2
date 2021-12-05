let guide = GUIDE_LINES

class Dock {
    constructor (x, y, width, height, color) {
        this.x = x
        this.y = y 
        this.width = width 
        this.height = height 
        this.color = color
    }
    draw (c) {
        c.save()
        c.beginPath()
        c.rect(this.x, this.y, this.width, this.height)
        c.fillStyle = this.color
        c.fill()

        c.lineWidth = 6
        c.strokeStyle =  "rgb(14, 61, 88)"
        c.stroke()
        c.restore()

        c.save()
        c.beginPath()
        c.rect(this.x - 5, this.y - 5, 15, this.height + 10)
        c.fillStyle = 'black'
        c.fill()
        c.restore()
    }
}

let dock

let id_set = 0
class Mass {
    constructor (x, y, mass, radius, angle, x_speed, y_speed, rotation_speed) {
        this.x = x
        this.y = y
        this.mass = mass || 1
        this.radius = radius || 50
        this.angle = angle || 0
        this.x_speed = x_speed || 0
        this.y_speed = y_speed || 0
        this.rotation_speed = rotation_speed || 0

        this.in_dock = false
        this.is_ship = false
        this.id = id_set
        id_set++
        this.collision_set = new Set([])
    }

    update (ctx) {

        this.x += this.x_speed 
        this.y += this.y_speed 
        this.angle += this.rotation_speed 
        this.angle %= (2 * Math.PI)

        //return back if hit to the wall
        if (this.x + this.radius > ctx.canvas.width || this.x - this.radius < 0 ) {
            this.x_speed = - this.x_speed 
            if (this.is_ship) touch_sound.play()
        }

        //to hit top and bottom
        if (this.y + this.radius > ctx.canvas.height || this.y - this.radius < 0 ) {
            this.y_speed = -this.y_speed
            if (this.is_ship) touch_sound.play()
        }

        //in the dock
        if ( 
            dock.y + this.radius < this.y &&
            dock.y + dock.height - this.radius > this.y &&
            dock.x < this.x &&
            dock.x + dock.width/2 > this.x
        ){
            this.x = dock.x + dock.width - this.radius
            this.y = dock.y + dock.height - this.radius
            this.x_speed = 0
            this.y_speed = 0
            this.in_dock = true
            touch_sound.play()

        } 

        //todo hit the dock top
        if (dock.y - this.radius < this.y && dock.y > this.y &&
            dock.x < this.x && dock.x + dock.width > this.x ){
                if (this.is_ship) touch_sound.play()
                this.y_speed = -this.y_speed
            }
            

        //todo hit the dock bottom
        if (dock.y + dock.height + this.radius > this.y && dock.y + dock.height < this.y &&
            dock.x < this.x && dock.x + dock.width > this.x ){
                if (this.is_ship) touch_sound.play()
                this.y_speed = -this.y_speed
            }
            
        //todo hit the dock right side
        if (dock.x + dock.width + this.radius > this.x && dock.x + dock.width - this.radius < this.x &&
            dock.y - this.radius < this.y && dock.y + dock.height + this.radius > this.y ){
                if (this.is_ship) touch_sound.play()
                this.x_speed = -this.x_speed
            }
            
        //todo edge and corner cases
    
    }

    //initial mass movement
    //to apply the force to the mass, causing acceleration, 
    //that is inversely proportional to the mass
    push (angle, force) {
        this.x_speed += (Math.cos(angle) * force) / this.mass
        this.y_speed += (Math.sin(angle) * force) / this.mass
    }
    //positive forces rotate the mass clockwise,
    //negative forces rotate the mass counterclockwise
    twist (force) {
        this.rotation_speed += force / this.mass;
    }

    //to calculate the speed and angle of movement of a Mass
    speed () {
        return Math.sqrt(Math.pow(this.x_speed, 2) + Math.pow(this.y_speed, 2))
    }
    movement_angle () {
        return Math.atan2(this.y_speed, this.x_speed)
    }

    draw (c) {
        c.save();
        c.translate(this.x, this.y)
        c.rotate(this.angle)
        c.beginPath()
        c.arc(0, 0, this.radius, 0, 2 * Math.PI)
        c.lineTo(0, 0)
        c.strokeStyle = "#FFFFFF"
        c.stroke()
        c.restore()
    }

}

class Ship extends Mass {
    //the bigger mass means smaller reaction to thrusters
    constructor(x, y, mass) {
        super(x, y, mass, 20, 1.5 * Math.PI)
        this.right_thruster = false
        this.left_thruster = false
        this.up_thruster = false
        this.down_thruster = false

        this.max_fuel = SHIP_MAX_FUEL
        this.fuel = this.max_fuel
        this.crashed = false
        this.is_ship = true

    }

    draw (c, guide) {
        if (this.in_dock) {
            this.drawDockedShip(c)
        } else {
            c.save()
            c.translate(this.x, this.y)
            drawShip(c, this.radius,  {
                guide: guide,
                right_thruster: this.right_thruster,
                left_thruster: this.left_thruster,
                up_thruster: this.up_thruster,
                down_thruster: this.down_thruster
            }, this.crashed)
            c.restore()
        }
    }
    
    drawDockedShip (c) {
        c.save()
        let image = new Image
        image.src = '../images/ship2.png'
        c.beginPath()
        c.drawImage(image, dock.x + dock.width / 2, dock.y + 4)
        c.restore()
    }

    update(context) {
        //consoleLogThurstersPower(this.up_thruster, this.down_thruster, this.left_thruster, this.right_thruster)
        super.push(this.angle, - this.up_thruster)
        super.push(this.angle, this.down_thruster)
        super.push(this.angle - Math.PI/2, this.right_thruster)
        super.push(this.angle - Math.PI/2, - this.left_thruster)
        super.update(context)
    }
}

class Asteroid extends Mass {
    constructor(x, y, mass, x_speed, y_speed, rotation_speed) {
        
        let density = 1 // kg per square pixel
        let radius = Math.sqrt((mass / density) / Math.PI)
        //x, y, mass, radius, angle, x_speed, y_speed, rotation_speed
        super(x, y, mass, radius, 0, x_speed, y_speed, rotation_speed)
        this.circumference = 2 * Math.PI * this.radius
        this.segments = Math.ceil(this.circumference / 15)
        this.segments = Math.min(25, Math.max(10, this.segments))
        this.noise = 0.09
        this.shape = []

        for (let i = 0; i < this.segments; i++) {
           this.shape.push(2 * (Math.random() - 0.5))
        }
        
    }
    
    draw (ctx, guide) {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.angle)
        drawAsteroid(ctx, {
            radius: this.radius, 
            shape: this.shape,
            x: this.x, y: this.y,
            x_speed: this.x_speed, y_speed: this.y_speed,
            options: {
                noise: this.noise,
                guide: guide
            }})
        ctx.restore()
    }

}

class Sound {
    constructor(src) {
        this.sound = document.createElement("audio")
        this.sound.src = src
        this.sound.setAttribute("preload", "auto")
        this.sound.setAttribute("controls", "none")
        this.sound.style.display = "none"
        document.body.appendChild(this.sound)
    }
    play(){
        this.sound.play()
    }
    stop(){
        this.sound.pause()
    }    
}

class Indicator {
    constructor (x, y, width, height) {
        //this.label = label + ":  "
        this.x = x
        this.y = y
        this.width = width
        this.height = height 
    }
    
    draw (c, max, level) {
        c.save()
        c.strokeStyle = "rgb(145, 226, 215)"
        c.fillStyle = "rgb(145, 226, 215)"
        //c.font = this.height + "pt Calibri"
        //let offset = c.measureText(this.label).width
        //c.fillText(this.label, this.x, this.y + this.height - 1)
        c.beginPath()
        c.rect(this.x, this.y, this.width, this.height)
        c.stroke()
        c.beginPath()
        c.rect(this.x, this.y, this.width * (max / level), this.height)
        c.fill()
        c.restore()
    }
}

const friction = 0.98
class Particle {
    constructor (x, y, radius, color, velocity) {
        this.x = x 
        this.y = y 
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1 //always 1, to fade out over time
    }
    draw () {
        c.save() //put game into a state
        c.GlobalAlpha = this.alpha
    
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false)
        c.fillStyle = this.color
        c.fill()
        
        c.beginPath()
        c.rect(this.x - 2 * Math.random, this.y - 2 * Math.random , this.radius * 2, this.radius * 3)
        c.fillStyle = this.color
        c.fill()
    
        c.restore() //finish of state
    }
    update() {
        this.draw()
        this.velocity.x *= friction //to enhace disapeare efekt
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.015 //slowly to fade out
    }
}

let color_i = 0
function drawShip(ctx, radius, options, crashed) {
    try{
        let color_stroke_1 = options.stroke || "orange"
        let color_stroke_2 = "blue"
        let color_fill_1 = options.fill || "blue"
        let color_fill_2 = "orange"
        let color_fill_3 = "yellow"
        options = options || {}

        if (crashed){

            options.up_thruster = false
            options.down_thruster = false 
            options.left_thruster = false 
            options.right_thruster = false

            color_i += 1
            color_stroke_1 = "red"
            color_fill_2 = "red"
            color_fill_3 = "orange"
            
            if (color_i >= 10 ){
                color_stroke_1 = "orange"
                color_fill_2 = "yellow"
                color_fill_3 = "red"
            }
            color_i = color_i >= 20 ? 0 : color_i
        }

        ctx.save()

        //ship
        ctx.lineWidth = options.lineWidth || 2
        ctx.strokeStyle = color_stroke_1
        ctx.fillStyle = color_fill_1
        ctx.beginPath() // draw the ship in four lines
        ctx.moveTo(-Math.sqrt((radius*radius)/2), -Math.sqrt((radius*radius)/2))//to statr draw a ship into moving context into origin
        ctx.quadraticCurveTo(0, 0, -Math.sqrt((radius*radius)/2), Math.sqrt((radius*radius)/2))
        ctx.quadraticCurveTo(0, 0, Math.sqrt((radius*radius)/2), Math.sqrt((radius*radius)/2))
        ctx.quadraticCurveTo(0, 0, Math.sqrt((radius*radius)/2), -Math.sqrt((radius*radius)/2))
        ctx.quadraticCurveTo(0, 0, -Math.sqrt((radius*radius)/2), -Math.sqrt((radius*radius)/2))

        ctx.fill()
        ctx.stroke()

        ctx.strokeStyle = color_stroke_2 
        ctx.lineWidth = 1
        ctx.fillStyle = color_fill_2 
        ctx.beginPath()
        ctx.arc(0, 0, radius/2, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        ctx.strokeStyle = color_stroke_2
        ctx.lineWidth = 1
        ctx.fillStyle = color_fill_3
        ctx.beginPath()
        ctx.arc(0, 0, radius/4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        //draw thrusters if on
        if (options.up_thruster || options.down_thruster || 
            options.left_thruster || options.right_thruster ){
                ctx.strokeStyle = "yellow"
                ctx.fillStyle = "red"
                ctx.lineWidth = 3
                ctx.save()
                ctx.beginPath()
                if(options.left_thruster) {
                    ctx.moveTo(- radius/2 - 2, - radius/4)
                    ctx.quadraticCurveTo(- radius - options.left_thruster*12, 0, - radius / 2 - 2, radius / 4)
                }
                if(options.right_thruster) {
                    ctx.moveTo(+ radius/2 + 2, - radius/4)
                    ctx.quadraticCurveTo(+ radius + options.right_thruster*12, 0, radius / 2 + 2,  radius / 4)
                }
                if(options.up_thruster) {
                    ctx.moveTo( - radius/4, - radius/2 - 2,)
                    ctx.quadraticCurveTo(0, - radius - options.up_thruster*12, radius / 4, - radius / 2 - 2, )
                }
                if(options.down_thruster) {
                    ctx.moveTo( + radius/4, + radius/2 + 2,)
                    ctx.quadraticCurveTo(0, + radius + options.down_thruster*12, - radius / 4, + radius / 2 + 2, )
                }
                ctx.fill()
                ctx.stroke()
                ctx.restore()
        }
    
        // a guide line and circle show the control point
        if (options.guide) {
            ctx.strokeStyle = "white"
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.arc(0, 0, radius, 0, 2 * Math.PI)
            ctx.stroke()
        }

        ctx.restore()
    } catch (err) {
        console.log(err)
    }
}

function drawAsteroid(ctx, asteroid) {
    let radius = asteroid.radius
    let shape = asteroid.shape
    let options = asteroid.options || {}
    ctx.strokeStyle = asteroid.options.stroke || "white"
    ctx.fillStyle = asteroid.options.fill || "silver"

    ctx.save()
    ctx.beginPath()

    for (let i = 0; i < shape.length; i++) {
        ctx.rotate(2 * Math.PI / shape.length)
        ctx.lineTo(radius + radius * options.noise * shape[i], 0)
    }

    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    //for testing and development
    if (options.guide) {
        ctx.lineWidth = 0.5
        ctx.strokeStyle = "white"
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, 2 * Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.lineWidth = 0.2
        ctx.strokeStyle = "white"
        ctx.arc(0, 0, radius + radius * options.noise, 0, 2 *Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(0, 0, radius - radius * options.noise, 0, 2 *Math.PI)
        ctx.stroke()

        //heading vector
        ctx.strokeStyle = "yellow"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo((0+ asteroid.x_speed*100), (0 + asteroid.y_speed*100))
        ctx.stroke()
    }
    ctx.restore()
}

//for testing and development
function drawGrid(ctx, minor, major, stroke, fill) {
    minor = minor || 10
    major = major || minor * 5
    stroke = stroke || "#00FF00"
    fill = fill || "#009900"
    ctx.save()
    ctx.strokeStyle = stroke
    ctx.fillStyle = fill
    
    let width = ctx.canvas.width, height = ctx.canvas.height
   
    for(let x = 0; x < width; x += minor) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.lineWidth = (x % major == 0) ? 0.5 : 0.25
        ctx.stroke()
        if(x % major == 0 ) 
            ctx.fillText(x, x, 10)
    }

    for (let y = 0; y < height; y += minor) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.lineWidth = (y % major == 0) ? 0.5 : 0.25
        ctx.stroke()
        if(y % major == 0 )
            ctx.fillText(y, 0, y + 10)
    }
    
    ctx.restore()

    c.save();

    c.strokeStyle = "red"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x -20 , dock.y - 20,);
    c.lineTo( dock.x + dock.width + 20 , dock.y - 20,);
    c.stroke(); 
    c.closePath();

    c.strokeStyle = "orange"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x -20 , dock.y +10 ,);
    c.lineTo( dock.x + dock.width + 20 , dock.y +10 );
    c.stroke(); 
    c.closePath();

    c.strokeStyle = "yellow"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x + dock.width + 20 , dock.y - 20);
    c.lineTo( dock.x + dock.width + 20 , dock.y + dock.height + 20);
    c.stroke(); 
    c.closePath();

    c.strokeStyle = "orange"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x + dock.width - 10 , dock.y - 20);
    c.lineTo( dock.x + dock.width -10 , dock.y + dock.height + 20);
    c.stroke(); 
    c.closePath();

    c.strokeStyle = "red"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x + dock.width + 20  , dock.y + dock.height + 20);
    c.lineTo( dock.x -20 , dock.y + dock.height + 20);
    c.stroke(); 
    c.closePath();

    c.strokeStyle = "orange"
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo( dock.x + dock.width + 20  , dock.y + dock.height - 10 ,);
    c.lineTo( dock.x -20 , dock.y + dock.height - 10  );
    c.stroke(); 
    c.closePath();

    c.restore();
}

//to control thrusters by arrow keys for test and dev
function keyHandler(e, value) {
    var nothing_handled = false
    
    if (value){
        value = 1
        ship.fuel -= 1
    }
        
    switch(e.key || e.keyCode) {
        case "ArrowUp":
        case 38: // up arrow
            ship.up_thruster = value
            break
        case "ArrowLeft":
        case 37: // left arrow
            ship.left_thruster = value
            break
        case "ArrowRight":
        case 39: // right arrow
            ship.right_thruster = value
            break
        case "ArrowDown":
        case 40:
            ship.down_thruster = value
            break
        case " ":
        case 32: //spacebar
            ship.trigger = value
            break
        case "g":
        case 71: //g
            if(value) 
                guide = !guide
        default:
            nothing_handled = true
    }
    if(!nothing_handled) e.preventDefault();
}

//for testing and development
function drawLine(ctx, obj1, obj2) {
    ctx.save()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(obj1.x, obj1.y)
    ctx.lineTo(obj2.x, obj2.y)
    ctx.stroke()
    ctx.restore()
}

function collision (obj1, obj2) {
    if (obj1.is_ship || obj2.is_ship)
        return distance_between(obj1, obj2) < (obj1.radius + obj2.radius) * 0.7
    return distance_between(obj1, obj2) < (obj1.radius + obj2.radius)
}

function distance_between (obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2))
}

////STOPWATCH
let startTime
let elapsedTime = 0
let stopWatchInterval

function startStopWatch() {
    startTime = Date.now() - elapsedTime
    stopWatchInterval = setInterval(() => {

      elapsedTime = Date.now() - startTime
      document.getElementById("timeEl").innerHTML = timeToString(elapsedTime)

    }, 10) //each 1/100 s

}

function resetStopWatch() {
    clearInterval(stopWatchInterval)
    document.getElementById("timeEl").innerHTML = "00:00:00"
    elapsedTime = 0
}

function timeToString(time) {
    let diffInHrs = time / 3600000
    let hh = Math.floor(diffInHrs)
  
    let diffInMin = (diffInHrs - hh) * 60
    let mm = Math.floor(diffInMin)
  
    let diffInSec = (diffInMin - mm) * 60
    let ss = Math.floor(diffInSec);
  
    let diffInMs = (diffInSec - ss) * 100
    let ms = Math.floor(diffInMs)
  
    let formattedMM = mm.toString().padStart(2, "0")
    let formattedSS = ss.toString().padStart(2, "0")
    let formattedMS = ms.toString().padStart(2, "0")
  
    return `${formattedMM}:${formattedSS}:${formattedMS}`
}

////
//for development and testing
let previous
function consoleLogThurstersPower (up_thruster, down_thruster, left_thruster, right_thruster) {
    try {
        let time_now = Date.now()
        console.log((time_now-previous)/100)
        previous = time_now

        console.log("up_thruster:    " + up_thruster)
        console.log("down_thruster:  " + down_thruster)
        console.log("left_thruster:  " + left_thruster)
        console.log("right_thruster: " + right_thruster)

    } catch (err) {
        console.log(err)
    }
}


  