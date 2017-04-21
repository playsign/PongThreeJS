PongThreeJS
===========

#### What

PongThreeJS is an online multiplayer pong game. This game is part of FI-WARE (http://www.fi-ware.eu/).  It's designed to be used as a use case for fi-ware mifi platform dev.

Live instance: http://playsign.github.io/PongThreeJS/

Video: https://www.youtube.com/watch?v=XR05_6kh5Dw

* **Features**
  - ThreeJS 3D javascript library http://threejs.org/
  - Ammo.js / Bullet physics (http://bulletphysics.org/ https://github.com/kripken/ammo.js/)
  - WebRTC with peer.js: 2 to 100 players multiplayer capability
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
