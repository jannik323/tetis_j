"use strict";

let can = document.getElementById("canvas");
let can2 = document.getElementById("preview");

const cPi = Math.PI;
let GameSpeed = 30;
let lastGameSpeed = 0;

let lastRenderTime = 0;
let direction_push = 0;


let fallInterval = 5;
let fallCounter = 0;

let unitsInGame = [];
let piecelocationYInGame = [];
let canspawn = false;

let deletedLine = 0;



can.width = 4*window.innerHeight/9;
can.height = 8*window.innerHeight/9;
let scale_divider = 14 //window.prompt("scale_divider")
let scale = can.width/scale_divider;

let ctx = can.getContext("2d");



can2.width = 2*window.innerHeight/9;
can2.height = 2*window.innerHeight/9;
let scaledivider2 = 7 //window.prompt("scale_divider")
let scale2 = can2.width/scaledivider2;

let ctx2 = can2.getContext("2d");


// hier
//UnitTemplate with offsets n stuff
const UnitTemplates = [
    
    {offsets : [{x: 0, y:0},{x: -1, y:-1},{x: -1, y:0},{x: 1, y:0}
                ],
    unitName: "piece_J",
    color: "#004de4"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: -1, y:0}
                ,{x: -1, y:1}],
    unitName: "piece_L",
    color: "#e46200"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 1, y:0},{x: 2, y:0}],
    unitName: "piece_I",
    color: "#01e4e4"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0}
                ,{x: 0, y:1},{x: 1, y:1}],
    unitName: "piece_O",
    color: "#e4de00"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 1, y:0}
                ,{x: 0, y:1}],
    unitName: "piece_T",
    color: "#9c13e4"},
    
    {offsets : [{x: 0, y:0},{x: 1, y:0}
               ,{x: -1, y:-1},{x: 0, y:-1}],
    unitName: "piece_Z",
    color: "#e40027"},
    
    {offsets : [{x: 0, y:0},{x: -1, y:0},{x: 0, y:-1}
               ,{x: 1, y:-1}],
    unitName: "piece_S",
    color: "#01e427"},
    
// non default -> selbst ausgedachte    
    
    {offsets : [{x: 0, y:0},{x: 1, y:0},{x: 2, y:0}
                ,{x: 0, y:1},{x: 1, y:1}],
    unitName: "pieceP",
    color: "grey"},


]


const shapes = []
for (let iUnit= 0; iUnit<UnitTemplates.length; iUnit++){
shapes.push(UnitTemplates[iUnit].unitName );
}
let nextshape = randomshape();
let nextshapeID = arrayMap();


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
        ctx.fillStyle= "black";
        ctx.strokeRect(scale*this.x,scale*this.y,scale , scale);

        // ctx.strokeRect(scale*this.x,scale*this.y,scale , scale);
        
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo((scale*this.x)+scale/10,(scale*this.y)+scale/10);
        ctx.lineTo((scale*this.x)+scale-scale/10,(scale*this.y)+scale/10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((scale*this.x)+scale/10,(scale*this.y)+scale/10);
        ctx.lineTo((scale*this.x)+scale/10,(scale*this.y)+scale-scale/10);
        ctx.stroke();
        ctx.strokeStyle = "black";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo((scale*this.x)+scale/10,(scale*this.y)+scale-scale/10);
        ctx.lineTo((scale*this.x)+scale-scale/10,(scale*this.y)+scale-scale/10);
        ctx.lineTo((scale*this.x)+scale-scale/10,(scale*this.y)+scale/10);

        ctx.stroke();

        ctx.strokeStyle = "black";
        ctx.globalAlpha = 1;

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
                
    }
        update = function(){
            
          
        
        if(this.focused){    

        this.dx = direction_push;              
        const answer_col = this.checkcollision();
            
            if(this.dx === -1 && answer_col.x && answer_col.x_dir ){
                this.dx = 0;
            }

            if(this.dx === 1 && answer_col.x && !answer_col.x_dir ){
                this.dx = 0;
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

            for (let i= 0; i<this.piecesInUnit.length;i++){
                this.piecesInUnit[i].x += this.dx;
                // if (this.piecesInUnit[i].x>scale_divider-1){this.piecesInUnit[i].x =0; }
                // if (this.piecesInUnit[i].x<0){this.piecesInUnit[i].x =scale_divider-1; }
                this.piecesInUnit[i].y += this.dy;
                }    

        }else{
          for (let i= 0; i<this.piecesInUnit.length;i++){ 
              if (piecelocationYInGame[this.piecesInUnit[i].y] === undefined){
               piecelocationYInGame[this.piecesInUnit[i].y] = 1 ;  
              }else{
            piecelocationYInGame[this.piecesInUnit[i].y] += 1}
            if (this.piecesInUnit[i].y === deletedLine){
            console.log(this.piecesInUnit[i]);
            // this.piecesInUnit[i] = {};
            // deletedLine = -1;

            
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
                    if(!unitsInGame[unit_i].focused){
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
                }else{
                    
                    for (let i= 0; i<unitsInGame[unitsInGame.length-1].piecesInUnit.length;i++){
                     
                        //collision x
                    if(this.piecesInUnit[piecesInUnit_i].x+1 === scale_divider){
                    collisionList.x = true;
                    collisionList.x_dir = false;
                    }

                    if(this.piecesInUnit[piecesInUnit_i].x ===0){
                      collisionList.x = true;    
                    collisionList.x_dir = true;
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
    nextshape = randomshape(); 
    nextshapeID = arrayMap();
    console.log(nextshapeID);
}
}else{
    unitsInGame[unitsInGame.length-1].fall(false);
}
 
deletedLine = -1;    

}


//render
function render(){


ctx.clearRect(0,0,can.width,can.height)
ctx2.clearRect(0,0,can.width,can.height)
    
preview();
    
for (let i= 0; i<unitsInGame.length;i++){   
unitsInGame[i].render();}

}


// spawn new

function spawnUnit(){
    
    const NewUnit = new pieceUnit(scale_divider/2,0,nextshape);
    unitsInGame.push(NewUnit);
}
    
    

//random unitshape

function randomshape(){
return shapes[Math.floor(Math.random()*shapes.length)]}


//preview

function preview(){

  
    for (let i= 0; i<UnitTemplates[nextshapeID].offsets.length; i++){


                    
     ctx2.lineWidth = 3;
     ctx2.fillStyle= UnitTemplates[nextshapeID].color;

     ctx2.fillRect((UnitTemplates[nextshapeID].offsets[i].x*scale2)+scale2*scaledivider2/2-scale2, 
     (UnitTemplates[nextshapeID].offsets[i].y*scale2)+scale2*scaledivider2/2-scale2,
     scale2, scale2);

        let thix = (UnitTemplates[nextshapeID].offsets[i].x*scale2)+scale2*scaledivider2/2-scale2;
        let thiy = (UnitTemplates[nextshapeID].offsets[i].y*scale2)+scale2*scaledivider2/2-scale2;

        ctx2.fillStyle= "black";
         ctx2.strokeRect((UnitTemplates[nextshapeID].offsets[i].x*scale2)+scale2*scaledivider2/2-scale2, 
         (UnitTemplates[nextshapeID].offsets[i].y*scale2)+scale2*scaledivider2/2-scale2,
         scale2, scale2);
        
         ctx2.lineWidth = 4;
         ctx2.globalAlpha = 0.5;
         ctx2.strokeStyle = "white";

         ctx2.beginPath();
          ctx2.moveTo((thix)+scale2/10,(thiy)+scale2/10);
         ctx2.lineTo((thix)+scale2-scale2/10,(thiy)+scale2/10);
             ctx2.stroke();
            ctx2.beginPath();
           ctx2.moveTo((thix)+scale2/10,(thiy)+scale2/10);
             ctx2.lineTo((thix)+scale2/10,(thiy)+scale2-scale2/10);
          ctx2.stroke();
          ctx2.strokeStyle = "black";
            ctx2.globalAlpha = 0.5;
            ctx2.beginPath();
            ctx2.moveTo((thix)+scale2/10,(thiy)+scale2-scale2/10);
             ctx2.lineTo((thix)+scale2-scale2/10,(thiy)+scale2-scale2/10);
             ctx2.lineTo((thix)+scale2-scale2/10,(thiy)+scale2/10);
             
             ctx2.stroke();
             
          ctx2.strokeStyle = "black";
             ctx2.globalAlpha = 1;        
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    }

        

}

// find id for nextshape

function arrayMap() {
  let pos = UnitTemplates.map(function (e) {
    return e.unitName;
  }).indexOf(nextshape);
return pos;
}

//input handling und so

addEventListener("keydown", e => {
  //  console.log(e.keyCode);
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
        case 32:
            fallCounter = fallInterval+1;
            break;
                } 
})

