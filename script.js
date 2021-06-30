"use strict";

let can = document.querySelector("canvas");
const cPi = Math.PI;
let GameSpeed = 60;
let lastGameSpeed = 0;

let lastRenderTime = 0;
let direction_push = 0;


let fallInterval = 5;
let fallCounter = 0;

let unitsInGame = [];
let piecelocationYInGame = [];
let canspawn = false;

let deletedLine = 0;


canvas.width = 4*window.innerHeight/9;
canvas.height = 8*window.innerHeight/9;
let scale_divider = 14 //window.prompt("scale_divider")
let scale = canvas.width/scale_divider;

let ctx = can.getContext("2d");


const colors = ["blue","black","red","yellow","green"]
// hier
//UnitTemplate with offsets n stuff
const UnitTemplates = [
    
    {offsets : [{x: 0, y:0},{x: 0, y:-1},{x: 1, y:0},{x: 2, y:0}
                ],
    unitName: "pieceJ",
    color: "blue"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: 2, y:0}
                ,{x: 0, y:1}],
    unitName: "pieceL",
    color: "orange"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 1, y:0},{x: 2, y:0}],
    unitName: "pieceI",
    color: "skyblue"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0}
                ,{x: 0, y:1},{x: 1, y:1}],
    unitName: "pieceO",
    color: "yellow"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 1, y:0}
                ,{x: 0, y:1}],
    unitName: "pieceT",
    color: "purple"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0}
               ,{x: -1, y:-1},{x: 0, y:-1}],
    unitName: "pieceZ",
    color: "green"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 0, y:-1}
               ,{x: 1, y:-1}],
    unitName: "pieceS",
    color: "red"},
    
// non default -> selbst ausgedachte    
    
    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: 2, y:0}
                ,{x: 0, y:1},{x: 1, y:1}],
    unitName: "pieceP",
    color: "grey"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0}],
    unitName: "piecePill",
    color: "olive"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: 2, y:0}
                ,{x: 3, y:0},{x: 0, y:1}],
    unitName: "pieceLBig",
    color: "pink"},
    
//    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: 2, y:0} // einfaches erstellen von UNits
//               ,{x: 0, y:1},{x: 1, y:1},{x: 2, y:1} // einfach die pos löschen die man nicht haben will
//               ,{x: 0, y:2},{x: 1, y:2},{x: 2, y:2}], // dies ist ein 3*3 block
//    unitName: "pieceBIGO",
//    color: "red"},


]


const shapes = []
for (let iUnit= 0; iUnit<UnitTemplates.length; iUnit++){
shapes.push(UnitTemplates[iUnit].unitName );
}



// piece (ein block)

class piece {
    constructor(x,y,unitTemplateIndex,pieceindex){
        this.x = x;
        this.y = y;
        this.focused = true;
        this.unitTempIUsed = unitTemplateIndex;
        this.pieceindex = pieceindex;
        
    }
    
    render = function(color){
        ctx.lineWidth = 3;
        ctx.fillStyle= color;
        ctx.fillRect(scale*this.x,scale*this.y,scale , scale);
//        ctx.fillStyle= "black";
//        ctx.strokeRect(scale*this.x,scale*this.y,scale , scale);
    }
    
    turn = function(){
        
        let tempX = UnitTemplates[this.unitTempIUsed].offsets[this.pieceindex].x;
        let tempY = UnitTemplates[this.unitTempIUsed].offsets[this.pieceindex].y;
        
        let moveXfromO = -1*tempY;
        let moveYfromO = tempX;
        
        this.x = this.x - tempX + moveXfromO;
        this.y =this.y - tempY + moveYfromO;
        
        UnitTemplates[this.unitTempIUsed].offsets[this.pieceindex].x = moveXfromO;
        UnitTemplates[this.unitTempIUsed].offsets[this.pieceindex].y = moveYfromO;
        
    }
    
   
        
    
        
}

//unit piece

class pieceUnit {
    constructor(x,y,unit){
        this.x = x;
        this.y = y;
        this.unit = unit;
        this.dx = 0;
        this.dy = 1;
        this.focused = true;
        this.piecesInUnit = [];
        let unitTemplateIndex;
        
        for (let iUnit= 0; iUnit<UnitTemplates.length; iUnit++){
        if(this.unit === UnitTemplates[iUnit].unitName){
        unitTemplateIndex = iUnit;   
        }
        }
        this.color = UnitTemplates[unitTemplateIndex].color;
        console.log("unit template id: " +unitTemplateIndex);
        
        for (let iOffset= 0; iOffset<UnitTemplates[unitTemplateIndex].offsets.length; iOffset++){
            
            const newpiece = new piece(UnitTemplates[unitTemplateIndex].offsets[iOffset].x+this.x,
                                    UnitTemplates[unitTemplateIndex].offsets[iOffset].y+this.y,unitTemplateIndex,iOffset);
            this.piecesInUnit[iOffset] = newpiece;
        }
        
//        this.piecesInUnit[0] = piece_1;
//        const piece_2 = new piece(this.x+randomPosPiece(),this.y+randomPosPiece());  
//        this.piecesInUnit[1] = piece_2;
//        const piece_3 = new piece(this.x+randomPosPiece(),this.y+randomPosPiece());  
//        this.piecesInUnit[2] = piece_3;
                
    }
        update = function(){
            
        this.dx = direction_push;    
        
        if(this.focused){    
        const answer_col = this.checkcollision();
            
            if(this.dx === -1 && answer_col.x && answer_col.x_dir ){
                this.dx = 0;
            }

            if(this.dx === 1 && answer_col.x && !answer_col.x_dir ){
                this.dx = 0;
            }
            
           for (let i= 0; i<this.piecesInUnit.length;i++){
                    this.piecesInUnit[i].x += this.dx;
                    // if (this.piecesInUnit[i].x>scale_divider-1){this.piecesInUnit[i].x =0; }
                    // if (this.piecesInUnit[i].x<0){this.piecesInUnit[i].x =scale_divider-1; }
                    this.piecesInUnit[i].y += this.dy;
                    }
            
            for (let i= 0; i<this.piecesInUnit.length;i++){
          if (this.piecesInUnit[i].y===(scale_divider*2)-1 || answer_col.y ){
                setTimeout(()=>{canspawn = true;}, 500);
                this.focused = false;
                this.dy = 0;
                this.dx = 0;
            }
        
            this.piecesInUnit[i].focused = this.focused;
              }
        }else{
          for (let i= 0; i<this.piecesInUnit.length;i++){ 
              if (piecelocationYInGame[this.piecesInUnit[i].y] === undefined){
               piecelocationYInGame[this.piecesInUnit[i].y] = 1 ;  
              }else{
            piecelocationYInGame[this.piecesInUnit[i].y] += 1}
            if (this.piecesInUnit[i].y === deletedLine){
            console.log("yea");
//            this.piecesInUnit.forEach(function(obj){
//            delete obj.newpiece;    
//                
//            })
            
            }
          }
        }
            
             }
        
        
        render = function(){
           for (let i= 0; i<this.piecesInUnit.length;i++){
                this.piecesInUnit[i].render(this.color);}
        }
        
        fall = function(a){
            if(this.focused && a){
            this.dy = 1;}
            else{
             this.dy = 0; 
            }
            
            
            
        }
        
        checkcollision = function(){
            let collisionList = {x:false, y:false,x_dir: false};
            let piecesInUnit_i =0;
            for (piecesInUnit_i; piecesInUnit_i<this.piecesInUnit.length;piecesInUnit_i++){
                let unit_i = 0;
                for (unit_i; unit_i<unitsInGame.length;unit_i++){ 
                    if(!unitsInGame[unit_i].focused ){
                    for (let i= 0; i<unitsInGame[unit_i].piecesInUnit.length;i++){
                        
                        
                        //collision x
                    if(this.piecesInUnit[piecesInUnit_i].x+1 === unitsInGame[unit_i].piecesInUnit[i].x && 
                      this.piecesInUnit[piecesInUnit_i].y === unitsInGame[unit_i].piecesInUnit[i].y  ||
                      this.piecesInUnit[piecesInUnit_i].x+1 === scale_divider                    
                      ){
                    collisionList.x = true;
                    collisionList.x_dir = false;
                    }

                    if(this.piecesInUnit[piecesInUnit_i].x-1 === unitsInGame[unit_i].piecesInUnit[i].x && 
                        this.piecesInUnit[piecesInUnit_i].y === unitsInGame[unit_i].piecesInUnit[i].y ||
                         this.piecesInUnit[piecesInUnit_i].x ===0
                      
                        ){
                      collisionList.x = true;    
                    collisionList.x_dir = true;
                      }
  



                    //collision y    
                    if(this.piecesInUnit[piecesInUnit_i].y+1 === unitsInGame[unit_i].piecesInUnit[i].y && 
                      this.piecesInUnit[piecesInUnit_i].x === unitsInGame[unit_i].piecesInUnit[i].x){
                    collisionList.y = true; 
                    }
                        
                        
                    
                    }
                }
                }
            }
            return collisionList;
        }
        
        
        turn = function(){
            if (this.focused){
            for (let i= 0; i<this.piecesInUnit.length;i++){
                this.piecesInUnit[i].turn();  }}
        }
   
}

//ende unit

const NewUnit = new pieceUnit(scale_divider/2,0,randomshape());
unitsInGame.push(NewUnit);
    
//start game
startGame();

//loop loop
function main(currentTime){
window.requestAnimationFrame(main);
const secondsSinceLastRender = (currentTime- lastRenderTime)/1000
if (secondsSinceLastRender < 1 / GameSpeed) {return}
lastRenderTime = currentTime;  
render();
update();
}

//game start

function startGame(){

window.requestAnimationFrame(main); 
}

//check for line to clear

function checkforLine (){
for (let i = 0; i<piecelocationYInGame.length; i++){
if (piecelocationYInGame[i] === scale_divider){
deletedLine = i;  
    
    
    
}
    
    
}
    
}

//update
function update(){

//console.log(piecelocationYInGame);
checkforLine();
piecelocationYInGame = [];    
  
for (let i= 0; i<unitsInGame.length;i++){   
unitsInGame[i].update();}
    
direction_push = 0;
fallCounter++    
if (fallCounter>fallInterval){
  fallCounter = 0;
    unitsInGame[unitsInGame.length-1].fall(true);
if(canspawn){
    spawnUnit();
    canspawn = false;
}
}else{
    unitsInGame[unitsInGame.length-1].fall(false);
}
 
deletedLine = -1;    
}


//render
function render(){
ctx.clearRect(0,0,canvas.width,canvas.height)
    
    
for (let i= 0; i<unitsInGame.length;i++){   
unitsInGame[i].render();}
}

//random pos (brauch nicht?)

function randomPosPiece(){
return Math.ceil(Math.random()*3)-2;}


// spawn new

function spawnUnit(){
    
    const NewUnit = new pieceUnit(scale_divider/2,0,randomshape());
    unitsInGame.push(NewUnit);}
    

// random color

function randomColor(){
return colors[Math.floor(Math.random()*colors.length)]}

//random unitshape

function randomshape(){
return shapes[Math.floor(Math.random()*shapes.length)]}

//input handling und so

addEventListener("keydown", e => {
 //   console.log(e.keyCode);
    switch(e.keyCode){
        case 65: 
            direction_push = -1;
            break;
        case 68:
            direction_push = +1;
            break;
        case 27:
            if (GameSpeed != 0){
                document.getElementsByClassName("pause")[0].style.visibility = "visible";
                console.log("Game has been stopped");
                lastGameSpeed = GameSpeed;
                GameSpeed = 0 ;
            }else{
                console.log("Game has been continued");
                GameSpeed = lastGameSpeed;
                document.getElementsByClassName("pause")[0].style.visibility = "hidden";}
            break;
//        case 32:
//            spawnUnit();
//            break;
        case 82: // r
            unitsInGame = [];
            spawnUnit();
            break;
            
        case 83: //s
            fallCounter+= 2
            break;
        case 69: //e
            unitsInGame[unitsInGame.length-1].turn();
            break;
        case 81: // q
            unitsInGame[unitsInGame.length-1].turn();
            unitsInGame[unitsInGame.length-1].turn();
            unitsInGame[unitsInGame.length-1].turn();
            
            break;
                } 
})

