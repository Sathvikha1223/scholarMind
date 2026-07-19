# ScholarMind

ScholarMind is an AI-powered Personal Knowledge Assistant that enables users to upload their own study materials—including PDFs, DOCX, PPTX, text files, Markdown, and source code—and interact with them through an intelligent chatbot. Built using React, FastAPI, PostgreSQL, ChromaDB, and Retrieval-Augmented Generation (RAG), ScholarMind extracts document content, generates embeddings, and uses an LLM to answer questions based only on the user's uploaded documents. It also generates summaries, one-page revision sheets, bullet-point notes, flashcards, quizzes, mind maps, and personalized revision plans.

Frontend:
Built using React and TypeScript, it's designed to feel responsive and interactive UI. It uses Tailwind CSS for styling, supports dark mode, and has smooth slide/fade animations. 

Backend:
It's written in FastAPI (Python), which makes it incredibly fast and able to handle file uploads smoothly. It validates all incoming data using Pydantic to prevent bugs, manages database tables using SQLAlchemy, and saves study history, timetables, and user settings to the database.

API:
The API acts as the bridge that lets the frontend and backend interact with each other. Every action from logging in to starting a chat uses clean, organized endpoints.Uses FastAPI that automatically generates interactive documentation that lists all these endpoints and lets you test them live.

JWT and Security:
Your study files and chats are strictly private. ScholarMind uses bcrypt to securely save your password when you sign up. Once logged in, you get a secure digital pass called a JWT (JSON Web Token). Every time your browser asks the backend for data, it presents this token, and the backend verifies it to ensure you only ever see your own personal workspace.

Document Upload & ChromaDB:
When you upload a PDF, DOCX, or code file, the app extracts the text page by page. It breaks the text into small, readable blocks and converts them into numeric values using a local AI model. These numeric values are stored in ChromaDB (a vector database) so that when you ask a question, the app can run a quick mathematical search to find the exact pages you're talking about.

Google Gemini API:
Once the app finds the relevant pages in ChromaDB, it bundles them up with your question and passes them to Google Gemini (gemini-1.5-flash). Gemini reads the context, writes a smart answer, and adds citations showing exactly which document and page the information came from. Your API key stays safely hidden on the backend, so it's never exposed to the web.

Visualization:
Quizzes & Flashcards: Gemini reads your documents and automatically builds multiple-choice quizzes and study cards.
Mind Maps: The AI generates a diagram outline, and the frontend uses Mermaid.js to draw a clean visual map of how concepts connect.
Analytics: The app tracks your streaks, study times, and quiz scores, displaying them in beautiful, easy-to-read charts.
