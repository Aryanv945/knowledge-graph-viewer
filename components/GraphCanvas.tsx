"use client"

import { useEffect, useRef, useState } from "react"
import cytoscape from "cytoscape"
import Papa from "papaparse"

export default function GraphCanvas() {

const containerRef = useRef<HTMLDivElement | null>(null)

const [selectedNode, setSelectedNode] = useState<any>(null)
const [editTitle, setEditTitle] = useState("")
const [editNote, setEditNote] = useState("")
const [cyInstance, setCyInstance] = useState<any>(null)

const [newTitle, setNewTitle] = useState("")
const [newNote, setNewNote] = useState("")

const [edgeSource, setEdgeSource] = useState("")
const [edgeTarget, setEdgeTarget] = useState("")
const [edgeLabel, setEdgeLabel] = useState("")

const [nodeCount,setNodeCount] = useState(0)
const [edgeCount,setEdgeCount] = useState(0)
const [nodeList,setNodeList] = useState<any[]>([])

useEffect(() => {

if (!containerRef.current) return

const savedGraph = localStorage.getItem("graph-data")

const graphStyle: any = [

{
selector:"node",
style:{
label:"data(label)",
width:70,
height:70,
"background-color":"#7c3aed",
"border-width":2,
"border-color":"#22c55e",
color:"#ffffff",
"font-size":"14px",
"font-weight":"bold",
"text-outline-width":3,
"text-outline-color":"#020617",
"text-valign":"center",
"text-halign":"center",
"shadow-blur":20,
"shadow-color":"#7c3aed"
}
},

{
selector:"edge",
style:{
label:"data(label)",
width:3,
"curve-style":"bezier",
"line-color":"#38bdf8",
"target-arrow-color":"#38bdf8",
"target-arrow-shape":"triangle",
"font-size":"12px",
"text-background-color":"#020617",
"text-background-opacity":0.9,
"text-background-padding":"4px",
"text-background-shape":"roundrectangle",
color:"#ffffff",
"text-rotation":"autorotate"
}
},

{
selector:".faded",
style:{opacity:0.15}
},

{
selector:":selected",
style:{
"border-width":4,
"border-color":"#22c55e"
}
}

]
/* LOAD FROM LOCAL STORAGE */

if (savedGraph) {

const cy = cytoscape({
container: containerRef.current,
elements: JSON.parse(savedGraph).elements,

style: graphStyle,
layout: {
name: "cose",
animate: true,
fit: true,
padding: 40
}
})
setNodeCount(cy.nodes().length)
setEdgeCount(cy.edges().length)

setNodeList(
cy.nodes().map((n:any)=>({
id:n.id(),
label:n.data("label")
}))
)

enableInteractions(cy)
setCyInstance(cy)
return
}

/* LOAD FROM CSV */

Promise.all([
fetch("/data/nodes.csv").then(r => r.text()),
fetch("/data/edges.csv").then(r => r.text())
]).then(([nodesCSV, edgesCSV]) => {

const parsedNodes:any = Papa.parse(nodesCSV,{header:true}).data
const parsedEdges:any = Papa.parse(edgesCSV,{header:true}).data

const nodes = parsedNodes
.filter((n:any)=>n.id)
.map((n:any)=>({
data:{
id:n.id,
label:n.title,
note:n.note
}
}))

const edges = parsedEdges
.filter((e:any)=>e.source)
.map((e:any,i:number)=>({
data:{
id:"e"+i,
source:e.source,
target:e.target,
label:e.label
}
}))

const cy = cytoscape({
container: containerRef.current,
elements:[...nodes,...edges],
style:graphStyle,
layout:{
name:"cose",
animate:true,
padding:40
}
})

setNodeCount(cy.nodes().length)
setEdgeCount(cy.edges().length)

setNodeList(
cy.nodes().map((n:any)=>({
id:n.id(),
label:n.data("label")
}))
)

enableInteractions(cy)

setCyInstance(cy)

})

},[])


function enableInteractions(cy:any){

cy.userZoomingEnabled(true)
cy.userPanningEnabled(true)
cy.autoungrabify(false)
cy.minZoom(0.5)
cy.maxZoom(2.5)

cy.on("tap","node",(evt:any)=>{

const node = evt.target
const neighborhood = node.closedNeighborhood()

cy.elements().addClass("faded")
neighborhood.removeClass("faded")

setSelectedNode({
id:node.id(),
label:node.data("label"),
note:node.data("note")
})

setEditTitle(node.data("label"))
setEditNote(node.data("note"))

})

cy.on("tap","edge",(evt:any)=>{

const edge = evt.target
const confirmDelete = confirm("Delete this edge?")

if(confirmDelete){

edge.remove()

localStorage.setItem(
"graph-data",
JSON.stringify(cy.json())
)

}

})

}


function addNode(){

if(!cyInstance || !newTitle) return

const id="n"+Date.now()

cyInstance.add({
data:{
id,
label:newTitle,
note:newNote
}
})

cyInstance.layout({name:"cose",animate:true}).run()

localStorage.setItem(
"graph-data",
JSON.stringify(cyInstance.json())
)

setNewTitle("")
setNewNote("")

}


function addEdge(){

if(!cyInstance || !edgeSource || !edgeTarget) return

const id="e"+Date.now()

cyInstance.add({
data:{
id,
source:edgeSource,
target:edgeTarget,
label:edgeLabel
}
})

cyInstance.layout({name:"cose",animate:true}).run()

localStorage.setItem(
"graph-data",
JSON.stringify(cyInstance.json())
)

setEdgeSource("")
setEdgeTarget("")
setEdgeLabel("")

}


function deleteNode(){

if(!cyInstance || !selectedNode) return

const node = cyInstance.getElementById(selectedNode.id)

node.remove()

localStorage.setItem(
"graph-data",
JSON.stringify(cyInstance.json())
)

setSelectedNode(null)

}

function zoomIn(){
if(!cyInstance) return
cyInstance.zoom(cyInstance.zoom()*1.2)
}

function zoomOut(){
if(!cyInstance) return
cyInstance.zoom(cyInstance.zoom()*0.8)
}

function resetGraph(){
if(!cyInstance) return
cyInstance.layout({name:"cose",animate:true}).run()
}

function fullReset(){
localStorage.removeItem("graph-data")
location.reload()
}

const controlBtn = {
padding:"6px 10px",
background:"#7c3aed",
color:"white",
border:"none",
borderRadius:"6px",
cursor:"pointer",
fontSize:"12px"
}

return (

<div style={{
width:"100vw",
height:"100vh",
position:"relative",
background:"#0b0418",
overflow:"hidden"
}}>

{/* HEADER */}

<div style={{
position:"fixed",
top:0,
left:0,
right:0,
height:"60px",
background:"#0f0725",
color:"#c4b5fd",
display:"flex",
alignItems:"center",
paddingLeft:"20px",
fontSize:"22px",
fontWeight:"bold",
borderBottom:"1px solid #312e81",
zIndex:50
}}>
KnowledgeGraph
</div>




{/* NODE LIST PANEL */}

<div style={{
position:"absolute",
top:150,
left:20,
background:"#0f0725",
padding:"15px",
borderRadius:"8px",
color:"#c4b5fd",
width:"220px",
maxHeight:"260px",
overflowY:"auto",
zIndex:15
}}>

<h4 style={{marginBottom:"8px"}}>Nodes</h4>

{nodeList.map(n=>(
<div key={n.id} style={{marginBottom:"6px"}}>
• {n.label}
</div>
))}

</div>


{/* GRAPH CONTROLS */}

<div style={{
position:"absolute",
top:"80px",
right: selectedNode ? "340px" : "20px",
display:"flex",
flexDirection:"column",
gap:"8px",
zIndex:40
}}>

<button onClick={zoomIn} style={controlBtn}>+</button>
<button onClick={zoomOut} style={controlBtn}>-</button>
<button onClick={resetGraph} style={controlBtn}>Reset</button>

</div>

<div style={{
position:"absolute",
top:"80px",
left:"20px",
width:"220px",
display:"flex",
flexDirection:"column",
gap:"15px",
zIndex:20
}}>

{/* COUNTERS */}

<div style={{display:"flex",gap:"10px"}}>

<div style={{
background:"#1e1b4b",
padding:"12px",
borderRadius:"6px",
color:"#c4b5fd",
flex:1,
textAlign:"center"
}}>
<div style={{fontSize:"22px"}}>{nodeCount}</div>
<div style={{fontSize:"12px"}}>Nodes</div>
</div>

<div style={{
background:"#1e1b4b",
padding:"12px",
borderRadius:"6px",
color:"#c4b5fd",
flex:1,
textAlign:"center"
}}>
<div style={{fontSize:"22px"}}>{edgeCount}</div>
<div style={{fontSize:"12px"}}>Edges</div>
</div>

</div>

{/* NODE LIST */}

<div style={{
background:"#0f0725",
padding:"12px",
borderRadius:"6px",
color:"#c4b5fd",
maxHeight:"200px",
overflowY:"auto"
}}>
<h4 style={{marginBottom:"6px"}}>Nodes</h4>

{nodeList.map(n=>(
<div key={n.id}>• {n.label}</div>
))}

</div>

</div>

{/* ADD NODE PANEL */}

<div style={{
position:"absolute",
top:420,
left:20,
background:"#0f0725",
padding:"15px",
borderRadius:"8px",
zIndex:10,
color:"white",
width:"220px"
}}>

<h4>Add Node</h4>

<input
placeholder="Title"
value={newTitle}
onChange={(e)=>setNewTitle(e.target.value)}
style={{
display:"block",
marginBottom:"8px",
padding:"6px",
background:"white",
color:"black",
borderRadius:"4px",
border:"none",
width:"100%"
}}
/>

<textarea
placeholder="Note"
value={newNote}
onChange={(e)=>setNewNote(e.target.value)}
rows={3}
style={{
display:"block",
marginBottom:"8px",
padding:"6px",
background:"white",
color:"black",
borderRadius:"4px",
border:"none",
width:"100%"
}}
/>

<button
onClick={addNode}
style={{
padding:"6px 10px",
background:"#7c3aed",
border:"none",
color:"white",
borderRadius:"4px"
}}
>
Add Node
</button>

</div>


{/* ADD EDGE PANEL */}

<div style={{
position:"absolute",
top:580,
left:20,
background:"#0f0725",
padding:"15px",
borderRadius:"8px",
zIndex:10,
color:"white",
width:"220px"
}}>

<h4>Add Edge</h4>

<input
placeholder="Source Node ID"
value={edgeSource}
onChange={(e)=>setEdgeSource(e.target.value)}
style={{display:"block",marginBottom:"8px",padding:"6px",background:"white"}}
/>

<input
placeholder="Target Node ID"
value={edgeTarget}
onChange={(e)=>setEdgeTarget(e.target.value)}
style={{display:"block",marginBottom:"8px",padding:"6px",background:"white"}}
/>

<input
placeholder="Relationship Label"
value={edgeLabel}
onChange={(e)=>setEdgeLabel(e.target.value)}
style={{display:"block",marginBottom:"8px",padding:"6px",background:"white"}}
/>

<button
onClick={addEdge}
style={{
padding:"6px 10px",
background:"#7c3aed",
border:"none",
color:"white",
borderRadius:"4px"
}}>
Add Edge
</button>

</div>


{/* GRAPH AREA */}

<div
ref={containerRef}
style={{
position:"absolute",
top:"60px",
left:"260px",
right: selectedNode ? "320px" : "0px",
bottom:"0px",
backgroundImage:
"linear-gradient(#1a1035 1px, transparent 1px),linear-gradient(90deg,#1a1035 1px,transparent 1px)",
backgroundSize:"40px 40px",
backgroundColor:"#0b0418"
}}
/>


{/* NODE DETAILS SIDEBAR */}

{selectedNode && (

<div style={{
width:"320px",
height:"100%",
background:"#140a30",
color:"#c4b5fd",
padding:"20px",
borderLeft:"1px solid #312e81",
overflowY:"auto",
position:"absolute",
right:0,
top:0
}}>

<h3 style={{color:"#a78bfa"}}>Node Details</h3>

<input
value={editTitle}
onChange={(e)=>setEditTitle(e.target.value)}
style={{
width:"100%",
padding:"8px",
marginBottom:"10px",
borderRadius:"4px"
}}
/>

<textarea
value={editNote}
onChange={(e)=>setEditNote(e.target.value)}
rows={6}
style={{
width:"100%",
padding:"8px",
borderRadius:"4px"
}}
/>

<button
onClick={()=>{
if(!cyInstance || !selectedNode) return
const node = cyInstance.getElementById(selectedNode.id)
node.data("label",editTitle)
node.data("note",editNote)
}}
style={{
marginTop:"10px",
padding:"8px 12px",
background:"#7c3aed",
color:"white",
border:"none",
borderRadius:"4px"
}}
>
Save Changes
</button>

<button
onClick={deleteNode}
style={{
marginTop:"10px",
padding:"8px 1px",
background:"#ef4444",
color:"white",
border:"none",
borderRadius:"4px"
}}
>
Delete Node
</button>

</div>

)}

</div>

)

}