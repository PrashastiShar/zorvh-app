# Zorvh — Full-Stack E-Commerce Clothing Platform

A full-stack e-commerce web application for a clothing brand, built with TypeScript, Node.js, and Firebase.

**Live site:** [zorvh.com](https://zorvh.com)

## Tech Stack

- **Frontend:** TypeScript, CSS
- **Backend:** Node.js, Firebase Cloud Functions
- **Database:** Firebase Firestore
- **Hosting:** Firebase Hosting
- **Tooling:** Webpack, npm, Git

## Project Structure
zorvh-app/
├── frontend/ # Customer-facing web application (TypeScript + CSS)
├── backend/ # Server-side application logic
├── functions/ # Firebase Cloud Functions (Node.js)
├── firestore-migration/ # Scripts for migrating data into Firestore
├── firebase.json # Firebase deployment configuration
└── .firebaserc # Firebase project binding

## Features

- Product catalog for clothing items
- Shopping cart and checkout flow
- Firebase-backed product and order data
- Responsive frontend styled with CSS
- Deployed to a custom domain via Firebase Hosting

## What I Learned

- Structuring a full-stack application with clear separation between the frontend, backend, and Cloud Functions
- Configuring Firebase Hosting, Cloud Functions, and Firestore for production deployment
- Writing and migrating data models in Firestore
- Managing a real e-commerce codebase with Git and npm
- Handling TypeScript across both client and server code

## Running Locally

```bash
git clone https://github.com/PrashastiShar/zorvh-app.git
cd zorvh-app
npm install
firebase login
firebase serve
firebase deploy
