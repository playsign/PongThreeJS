PongThreeJS
===========

#### Installation of the EC branch

This branch has a version which is ported to the realXtend Entity-Component system. It depends on a couple of submodules where the Tundra websocket networking is implemented. To get this branch and the submodules:

     git clone https://github.com/playsign/PongThreeJS.git
     git checkout ec
     cd PongThreeJS/
     git submodule init
     git submodule update

Then open a Tundra server with the server side of the game in the server/ dir of this repo:

     ./Tundra --server --file /path/to/PongThreeJS/server/scene.txml

Set the IP of the server to the client side conf in webTundraModel.js and open Pong.html in your browser.

#### What

PongThreeJS is an online multiplayer pong game. This game is part of FI-WARE (http://www.fi-ware.eu/).  It's designed to be used as a use case for fi-ware mifi platform dev.
You can try the game here: https://dl.dropboxusercontent.com/u/60485425/Playsign/GitHub/PongThreeJS/Pong.html

* **Features**
  - ThreeJS 3D javascript library http://threejs.org/
  - Ammo.js / Bullet physics (http://bulletphysics.org/ https://github.com/kripken/ammo.js/)
  - 2 to 100 players multiplayer capability
  - Dynamically increasing and decreasing game area.

#### Why

Pong is a great use case, because it's minimalistic and still it can provide a full test case. Multi-user environment allows us to do e.g. network testing and checking with different user counts. This was Jarkko's idea so credits to him.

#### How

First we created the game without additional frameworks like Bullet physics. Finally we will include an entity system. It makes everything straightforward, easier and better, as we need less code and the game is overall better.

#### Conclusion

(TODO)

#### Usage

- Controls
  - Player 1 (and players from 3 to 100): move left: A, move right: D
  - Player 2: move left: left arrow, move right: right arrow
  - Debug ball move: u,h,j,k
- Use the top right sliders to change player amount and ball's speed
- Online game
  - Coming!
- Development tips
  - TODO 
