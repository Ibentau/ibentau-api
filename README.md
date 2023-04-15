# Ibentau Q&A Chatbot API

This repository contains the code for a Q&A chatbot API that answers questions based on the content of a website. It also includes scripts to train the bot.

## Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

- Scrape website content and store it in a database
- Train the chatbot based on the scraped content
- Expose an API to interact with the chatbot

## Requirements

- Node.js
- pnpm package manager
- OpenAI API key
- Weaviate database (can be run locally)

## Installation

1. Clone the repository:

```
git clone https://github.com/Ibentau/ibentau-api
```

2. Change the working directory:

```
cd ibentau-api
```

3. Install dependencies:

```
pnpm install
```

## Configuration

1. Set the following environment variables:
    - `OPENAI_API_KEY`: OpenAI API key
    - `WEAVIATE_SCHEME`: either `http` or `https`
    - `WEAVIATE_HOST`: the host of the Weaviate database (e.g. `localhost:8080`)

2. Edit the `urls.json` file to include the URLs you want to scrape.

3. Adapt the scrapping function in the `scripts/scrape.ts` file to the structure of the web pages you want to scrape.

## Usage

1. Scrape the website content:

```
pnpm run scrape
```

2. Generate embeddings for the scraped content:

```
pnpm run generate_embeddings
```

3. Initialize the Weaviate database:

```
pnpm run init_weaviate
```

4. Start the development server:

```
pnpm run dev
```

The API will be available at `http://localhost:3000`.

## License

This project is licensed under the terms of the MIT license. See [LICENSE](LICENSE) for details.
