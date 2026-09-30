# 2026-cmd-hackathon
# MedEx: Medication Experience Sharing Platform

A web platform where people can share and browse real-world experiences with medications. Built during a hackathon in March 2026.

## Motivation

Many minority groups are underrepresented in medical research, so the effects of a medication on them are often less well documented. MedEx explores one way to help fill that gap: letting users share their own experiences in a structured way, so that others with similar backgrounds can learn from them.

## Features

- **User accounts:** registration and login with session-based authentication (Flask sessions) and password hashing (Werkzeug)
- **Structured experience posts:** guided posting across multiple dimensions, so experiences are shared systematically rather than as free-form text
- **Filtering:** filter posts by gender, effectiveness, side effects, and treatment duration
- **Poll voting:** on each post's detail page, with a progress-bar visualization of the results
- **Threaded comments:** replies and @mentions
- **User profiles:** each user has a profile page with their own posts and a message inbox

## Screenshots

> **Note:** MedEx was originally hosted on a free-tier platform. Because free hosting is not reliably available over the long term, I have documented the features with screenshots below instead of keeping a live demo running.

### Home
https://github.com/user-attachments/assets/ad8a1a87-a9d0-4a88-b65c-a67fda4fb549

### Login and Registration
https://github.com/user-attachments/assets/a19a0edf-9e83-49ed-96da-f0a7d8077ba0

### Creating an Experience Post
https://github.com/user-attachments/assets/36aab53e-4b09-4d86-a42d-c59c1642abbe
https://github.com/user-attachments/assets/1fc011ed-3391-4d28-a0a8-fc0b60a9d604
https://github.com/user-attachments/assets/af498ae5-f683-48a9-a8d9-05e978857908

### Filtering Posts
https://github.com/user-attachments/assets/1f02d40e-7884-43a3-9df6-bd776781e60f

### Post Detail with Poll Voting
https://github.com/user-attachments/assets/af7ee24c-4c60-414b-937a-00c48cc66a3f

### User Profile and Inbox
https://github.com/user-attachments/assets/930c8c69-a4cc-42d4-b14f-4dceb129e70b


## Tech Stack

- **Backend:** Python, Flask
- **Database:** SQLite
- **Templating:** Jinja2
- **Frontend:** HTML, CSS, JavaScript (no frameworks)

## Development Notes

This project was built in a hackathon setting with AI-assisted
