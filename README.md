# ARL STRONG UML - Robot Simulation
This project is a study conducted by ARL STRONG UMass Lowell.

## Website
![simulation gif](https://media.giphy.com/media/4Xv6MxRUr6saZ2WSjs/giphy.gif)

https://arlstrong-uml-robot-simulation.herokuapp.com/

### Background
This project pertains to team formation in groups of humans and robots trying to accomplish a common objective, such as a search and rescue operation. Teams succeed because of the network of relationships they possess, and the emergent behaviors this network facilitates. These emergent behaviors arise due to three constructs: (a) multiple agents in the team capable of taking actions, (b) interactions between the agents, and (c\) emergence of global-scale patterns due to the interactions. The overall research strategy and objective tackles each of these constructs as separate tasks in the context of a search and rescue mission. Search and rescue operations are often severely resource constrained in terms of time, energy, and information organization. Operating in such resource-constrained scenarios can impact the ability of human-agent teams to tackle complex problems, resulting in sub-optimal outputs.

### Objective
This study is largely exploratory. We will vary study parameters such as the goal assigned to the human-robot team, the complexity of the search and rescue environment, and the resources available to the team (such as level of map detail). We will observe and measure the resulting trust between humans and robots in the team, as well as the level of team performance and cohesion.

###  Project Details
The website uses Node JS, Express, and MongoDB.

#### Instructions on how to use the website
![human on the map](/public/img/blue.png)

The blue colored square represents a human on the map. The light blue colored area shaded around the human is the area of the map visible to (human's field of view)/explored by the human.

![explored area on the map not integrated](/public/img/green.png)

The red colored square represents an agent on the map that moves autonomously. The green colored area shaded around the agent is the area of the map visible to (agent's field of view)/explored by the agent in the current interval.

![explored area on the map integrated](/public/img/red.png)

The light red colored area shaded on the map is the area of the map that has been explored by the agent in the past intervals and has been integrated by the human.

![area on the map explored by both human and agent](/public/img/yellow.png)

The yellow colored area shaded on the map is the area of the map that has been explored by both the agent and the human in the past intervals and has been integrated by the human.

![trust confirmation screen](/public/img/pop-up.png)

Use the arrow keys or awsd (or hjkl if you're a vim power user) to control the human. After every 30 seconds, you will be shown the images of the current state of the whole map, the human explored area, and the agent explored area. You will be prompted to either integrate or discard the agent explored region. If you choose to integrate, the agent explored region (shaded green) will turn red. If you choose to discard this area, the green colored region will disappear and is considered unexplored.

![Victim marker](/public/img/victim-marker-front.png)

This marker on the minimap in the trust confirmatin pop-up means that a victim has been found on the map.

![Hazard marker](/public/img/hazard-marker-front.png)

This marker on the minimap in the trust confirmation pop-up means that a hazard has been found on the map.
