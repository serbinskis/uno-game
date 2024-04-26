# UNO Game

This repository contains the source code for a web-based UNO game. UNO is a popular card game where players take turns matching cards in their hands with the current card shown on top of the deck by either color or number. The goal is to be the first player to get rid of all the cards in their hand.

![](https://i.imgur.com/1Upj1DZ.jpeg)

## Features

- Player Customization: Players can customize their username and avatar.
- Game Settings: Various game settings such as starting cards, maximum players, player time, etc., can be adjusted.
- Avatar Selection: Users can select an avatar from their local files to represent themselves in the game.
- Real-Time Gameplay: The game supports real-time multiplayer gameplay where players can join and interact with each other.
- Card Animations: Animations for card movements, such as sliding up and dropping down, enhance the user experience.
- Winner Display: When a player wins the game, a visually appealing winner display is shown.
- UNO Indicator: An indicator shows when a player has only one card left, as per UNO rules.

## Setup

To set up the UNO game locally, follow these steps:

1. Clone this repository to your local machine using `git clone https://github.com/WobbyChip/uno-game`.
2. Navigate to the project directory.
3. Run `npm build` and `npm start`.

## Usage

1. Upon opening the game, players can customize their username and select an avatar.
2. Players can adjust game settings by clicking on the settings icon.
3. To start the game, click on the "Connect" button after customizing settings.
4. During gameplay, players take turns playing cards that match the top card of the deck by color or number.
5. The game continues until one player successfully empties their hand of cards.
6. The winner is displayed, and players have the option to play again or exit the game.

## Technologies Used

- NodeJS
- Socket.io (for real-time communication)
- JavaScript (including jQuery for DOM manipulation)
- HTML
- CSS
