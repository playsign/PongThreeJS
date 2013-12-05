<entity id="3" sync="1">
var pa = new Entity();

< component type = "EC_Placeable"sync = "1" >
var component = pa.createComponent(components.length, "EC_Placeable","optionaalinenNimiVaikkaPlayerAreanPlaceable"); //id, typeId, name

< attribute value = "1.45201,-4.65185,5.40487,-47.8323,42.1262,-145.378,1,1,1"
name = "Transform" / >

component.addAttribute("real", attributes.length, "x", x); //typeId, id, name, value
