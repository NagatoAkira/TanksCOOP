canvas = document.querySelector("canvas")
ctx = canvas.getContext('2d')

canvas.height = window.innerHeight
canvas.width = window.innerWidth

// Initialize server
const ws = new WebSocket(`ws://${window.location.host}`);

// This variable exists because of listener in next
var keyboardInputDict = {up:false, down: false, left: false, right: false, z: false, x: false, space: false}
onkeydown = function(event){
	// Fill input dictionary if player pressed arrow buttons
	let map = keyboardInputDict
	switch(event.key){
		case "ArrowUp":
			map.up = true
			break
		case "ArrowRight":
			map.right = true
			break
		case "ArrowLeft":
			map.left = true
			break
		case "ArrowDown":
			map.down = true
			break
		case "z":
			map.z = true
			break
		case "x":
			map.x = true
			break
		case " ":
		  map.space = true
		  break
	}
}
onkeyup = function(event){
	// Fill input dictionary if player pressed arrow buttons
	let map = keyboardInputDict
	switch(event.key){
		case "ArrowUp":
			map.up = false
			break
		case "ArrowRight":
			map.right = false
			break
		case "ArrowLeft":
			map.left = false
			break
		case "ArrowDown":
			map.down = false
			break
		case "z":
			map.z = false
			break
		case "x":
			map.x = false
			break
		case " ":
		  map.space = false
		  break
	}
}

// Initialize all start stats for drawing primal geometric figures (like color, line width)
function initDrawConfigurationForAllObjectsInScene(){ 
ctx.strokeStyle = 'green'
ctx.lineWidth = 1.5
}
// Draw Circle
function drawCircle(x, y, radius) {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
  ctx.fill()
  ctx.closePath()
}
// Get Distance Between Two Points
function getDistance(x1, y1, x2, y2){
	return Math.sqrt((x2-x1)**2 + (y2-y1)**2)
}
// Get Vector
function getVector(x1, y1, x2, y2){
	let dist = getDistance(x1, y1, x2, y2)
	return {x: (x2-x1)/dist, y: (y2-y1)/dist}
}
// Standard Function For Update Frame
function gameUpdate(){
	ctx.clearRect(0,0,canvas.width, canvas.height)
	ctx.fillStyle = '#e8e8e8'
	ctx.fillRect(0,0,canvas.width, canvas.height)
}

class Impulse{
	constructor(){
		this.points = 0
	}
	activate(divide){
		if(this.points > 1){
			this.points = 1
		}
		this.points += 1/divide
	}
	recharge(){
		this.points = 1
	}
}

class Projectile{
	constructor(x,y,dirDeg){
		this.x = x
		this.y = y 
		this.dirDeg = dirDeg

		this.speed = 5
	}
	draw(){
		drawCircle(this.x, this.y, 10)
	}
}
class Tower{
	constructor(player){
		//Import Configures of Player
		this.player = player

		this.dots = [{deg: 30, dist:10}, {deg: -30, dist:10},
									 {deg: 10+180, dist:50}, {deg: -10+180, dist:50}]

		// Variable to define movement direction
		this.dirDeg = 180

		// Projectiles which were shoot by Tower 
		// (only configuration other operation will be completed by server)
		this.projectiles = [] // There will be added projetctiles
	}
	rotate(deg){
		deg *= 4
		for(let dot in this.dots){
			dot = this.dots[dot]
			dot.deg += deg
		}

		this.dirDeg += deg
	}
	inputRotate(){ // Moving by keyboard
		let map = keyboardInputDict
		map.z ? this.rotate(1):null
		map.x ? this.rotate(-1):null
	}
	shoot(){ // Shoot by Projectiles
		let map = keyboardInputDict
		map.space ? this.projectiles.push({x: server.x, y: server.y, dirDeg: this.dirDeg}):null
		if(map.space){
			isShoot = false
			shootTimer.curr = 0
		}
	}
	draw(){ // draw Tower of Player Tank
			let rad = 10
			ctx.fillStyle = "#69b334"
			ctx.beginPath()
			ctx.moveTo(Math.sin(this.dots[0].deg*Math.PI/180)*this.dots[0].dist+this.player.x,
								 Math.cos(this.dots[0].deg*Math.PI/180)*this.dots[0].dist+this.player.y)
			for(let doto = 0; doto<this.dots.length; doto++){
					let dot = this.dots[doto]
					ctx.lineTo(Math.sin(dot.deg*Math.PI/180)*dot.dist+this.player.x,Math.cos(dot.deg*Math.PI/180)*dot.dist+this.player.y)
			}
			ctx.fill()
			ctx.closePath()
			drawCircle(this.player.x, this.player.y, 25)
	}
	update(isYour = true){
		this.draw()
		if(isYour){
		this.inputRotate()
		if(isShoot){
			this.shoot()
		}
		}
	}
}

class Player{
	constructor(){
		// Position
		this.x = window.innerWidth/2
		this.y = window.innerHeight/2
		// Object Points
		// We seperate game object into two groups of dots: top and down
		this.dots ={ 
		top:[{deg:40, dist:50}, {deg:-40,dist:50}],
		down:[{deg:35+180, dist:70}, {deg:-35+180,dist:70}]
		}
		// Variable to define movement direction
		this.dirDeg = 180
		// Speed
		this.speed = 8
		// Health Points
		this.hp = 3
		// Init Tower to Shoot In Game
		this.Tower = new Tower(this)
	}
	move(x,y){ // Input direction where must be object in next frame
			this.x += x * this.speed
			this.y += y * this.speed

			server.x += x * this.speed
			server.y += y * this.speed
	}
	rotate(deg){
		let top = this.dots.top
		let down = this.dots.down
		deg *= 4

		top[0].deg += deg
		top[1].deg += deg
		down[0].deg += deg
		down[1].deg += deg
		this.dirDeg += deg
	}
	inputMove(){ // Moving by keyboard
		let map = keyboardInputDict
		map.up ? this.move(Math.sin(this.dirDeg*Math.PI/180),Math.cos(this.dirDeg*Math.PI/180)):null
		map.down ? this.move(-Math.sin(this.dirDeg*Math.PI/180),-Math.cos(this.dirDeg*Math.PI/180)):null

		map.right ? this.rotate(-1):null
		map.left ? this.rotate(1):null
	}
	draw(){ // Draw Object (Now in base form using basic instrumetal of JS visualizing)
		let top = this.dots.top
		let down = this.dots.down
		let rad = 15

		
		ctx.fillStyle = "#668252"

		ctx.beginPath()
		ctx.moveTo(Math.sin(top[0].deg*Math.PI/180)*top[0].dist+this.x,Math.cos(top[0].deg*Math.PI/180)*top[0].dist+this.y)
		ctx.lineTo(Math.sin(top[1].deg*Math.PI/180)*top[1].dist+this.x,Math.cos(top[1].deg*Math.PI/180)*top[1].dist+this.y)
		ctx.lineTo(Math.sin(down[0].deg*Math.PI/180)*down[0].dist+this.x,Math.cos(down[0].deg*Math.PI/180)*down[0].dist+this.y)
		ctx.lineTo(Math.sin(down[1].deg*Math.PI/180)*down[1].dist+this.x,Math.cos(down[1].deg*Math.PI/180)*down[1].dist+this.y)
		ctx.lineTo(Math.sin(top[0].deg*Math.PI/180)*top[0].dist+this.x,Math.cos(top[0].deg*Math.PI/180)*top[0].dist+this.y)
		ctx.fill()
		ctx.closePath()
	}
	keepMovementInBorders(){
		// Player Movement
		this.inputMove()
		// Get Coordinates of Screen Center
		let centerX = window.innerWidth/2
		let centerY = window.innerHeight/2

		// Distance between Player and Screen Center
		let dist = getDistance(this.x, this.y, centerX, centerY)
		let maxDist = (centerX<centerY ? centerX : centerY) - 100 

		let IsBlockMovement = dist >= maxDist

		// Push Player into Borders
		while(IsBlockMovement){
			dist = getDistance(this.x, this.y, centerX, centerY)
			IsBlockMovement = dist >= maxDist

			// Get Distance to push back Player
			let vect = getVector(this.x, this.y, centerX, centerY)
			
			this.x = centerX - vect.x*dist*0.999
			this.y = centerY - vect.y*dist*0.999
		}
	}
	update(isYour = true){ // Summurize all active functions in one
		this.draw()
		if(isYour){
		this.keepMovementInBorders()
		}

		// Update Tower
		this.Tower.update(isYour) 
	}
}

class Server{
	constructor(){
		this.id = parseInt(10**10*Math.random())
		this.player = null
		// Global Position
		this.x = 0 // For Example
		this.y = 0 // For Example

		this.players = {} // all players in scene from server
		this.projectiles = {} // all projectiles in scene from server

		this.isDead = false

		this.nickname = "player"+this.id.toString()
	}
	sendToServerGlobal(){
		let ply = this.player
		const player = JSON.stringify({id:this.id,tag:"player",x:this.x, y:this.y, 
			                             dots: ply.dots, tower:{dots:ply.Tower.dots},
			                             projectiles: ply.Tower.projectiles, 
			                             hp: this.player.hp, score: 0, isDead: this.isDead,
			                           	 nickname: this.nickname})
		ws.send(player)
	}
	getServerData(){
		let players = this.players
		let projectiles = this.projectiles
		let id = this.id
		let x = this.x
		let y = this.y

		// Getting message
        ws.onmessage = function(event){
            const objects = JSON.parse(event.data)
           	
           	// If Player is disconnected or dead we are going to clear it
           	for(let ply in players){
           		if(objects[ply] == null){
           			delete players[ply]
           		}
           	}
           	for(let prj in projectiles){
           		if(objects[prj] == null){
           			delete projectiles[prj]
           		}
           	}

           	// Update our data from server
            for(let obj in objects){

            	if(objects[obj].tag == "player"){
            	if(players[obj] == null){
            		players[obj] = new Player()
            	}
            	players[obj].x = objects[obj].x - x + player.x 
            	players[obj].y = objects[obj].y - y + player.y
            	players[obj].dots = objects[obj].dots
            	players[obj].Tower.dots = objects[obj].tower.dots
            	players[obj].id = objects[obj].id
            	players[obj].score = objects[obj].score
            	players[obj].hp = objects[obj].hp
            	players[obj].nickname = objects[obj].nickname
							
            	if(projectiles[obj] == null){projectiles[obj] = []}

  						for(let prj in objects[obj].projectiles){
  							if(projectiles[obj][prj] == null){
  								projectiles[obj].push(new Projectile())
  							}else{
  								let tmp = objects[obj].projectiles[prj]
  								projectiles[obj][prj].x = tmp.x - x + player.x
									projectiles[obj][prj].y = tmp.y - y + player.y

									projectiles[obj][prj].dirDeg = tmp.dirDeg
  							}
  						}
  						}
            }
          }

    // Check errors of WebSocket
        ws.onerror = function(error) {
            console.error("WebSocket Error:", error)
        }
	}
	update(){
		this.player.update()
		for(let player in this.players){
			if(player == this.id || this.players[player] == null){continue}
			player = this.players[player]
			player.update(false)
		}
		// Draw all projectiles
		for(let prj in this.projectiles){
			if(this.projectiles[prj] == null){continue}
			prj = this.projectiles[prj]
			for(let prjo in prj){
				prjo = prj[prjo]
				prjo.draw()
			}
		}
		// Update position of your projectiles
		for(let prj in this.projectiles[this.id]){
		this.player.Tower.projectiles[prj].x += Math.sin(this.player.Tower.projectiles[prj].dirDeg*Math.PI/180) 
		this.player.Tower.projectiles[prj].y += Math.cos(this.player.Tower.projectiles[prj].dirDeg*Math.PI/180)
		}
	}
}

class Interface{
	constructor(){
		this.players = server.players
	}
	showLeaderBoard(){
		ctx.fillStyle = 'black'
		ctx.font = "500 25px Host Grotesk"
		ctx.fillText("Leader Board", 15, 30)

		ctx.fillStyle = "#828282"
		ctx.font = "400 15px Host Grotesk"
		let count = 0
		let gap = 15
		let marginY = 60
		for(let ply in this.players){
			if(count == 10){break}
			ctx.fillText(this.players[ply].nickname, 15, marginY+count*gap)
			ctx.fillText(this.players[ply].score, ctx.measureText(this.players[ply].nickname).width+15+10, marginY+count*gap)
			count++
		}
			ctx.fillRect(15, marginY+(count)*15, 100, 2)
			ctx.fillText(this.players[server.id].nickname, 15, marginY+(count+1.5)*gap)
			ctx.fillText(this.players[server.id].score, ctx.measureText(this.players[server.id].nickname).width+15+10, marginY+(count+1.5)*gap)
		
	}
	reloadShoot(){
		if(isShoot == false){
			let player = server.player
			let text = ((shootTimer.end - shootTimer.curr)*0.1).toFixed(1).toString()
			ctx.font = "17px serif"
			ctx.fillText(text+'s', player.x-ctx.measureText(text).width/2-2, player.y+5)
		}
	}
	update(){
		this.showLeaderBoard()
		this.reloadShoot()
	}
}


var server = new Server()

function startGame(){
	const start = document.getElementById("start")
	const nickname = document.getElementById("nickname")
	if(nickname.value.length != 0){
		server.nickname = nickname.value
	}
	start.style.display = "none"
}

// It needed to config draw functions for game objects
initDrawConfigurationForAllObjectsInScene()



var player = new Player()
server.player = player

// Make shoot limit per second 
var isShoot = false
var shootTimer = {curr:0, end:5}
setInterval(()=>{
if(shootTimer.curr >= shootTimer.end){
isShoot = true
}
if(isShoot==false){
shootTimer.curr++
}
},100)

var interface = new Interface()

let fps = 60



function main(){
	setTimeout(()=>{
	window.requestAnimationFrame(main)
	}, 1000/fps)
	gameUpdate()

	server.update()

	server.getServerData()
	server.sendToServerGlobal()

	interface.update()
}
main()
