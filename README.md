# Relevia

Relevia is a web application designed to help individuals manage and overcome panic attacks. It provides resources, tools, and support to address emotions and cope effectively. This project is a small effort from EmpowerED Global to raise awareness about panic attacks.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contact](#contact)

## Features

- **Resource Library**: Comprehensive articles and guides on understanding panic attacks.
- **Interactive Tools**: Breathing exercises, grounding techniques, and tracking logs.
- **Animated UI**: Smooth, responsive animations powered by Framer Motion.
- **Responsive Design**: Optimized for mobile and desktop devices.
- **Tailwind CSS**: Custom styling for a modern, cohesive look.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Bushraabir/relevia.git
   ```
2. Navigate to the project directory:
   ```bash
   cd relevia
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

Once the development server is running, open [http://localhost:5173](http://localhost:5173) in your browser. Explore the navigation menu to access different sections:

- **What is it actually?**: Learn about panic attacks.
- **Coping Techniques**: Interactive exercises and tools.
- **Medication**: Information on medications.
- **Contact**: Reach out for support or collaboration.

## The Relevia chatbot

The chat runs a small AI model **inside the visitor's browser** with WebGPU (via [WebLLM](https://github.com/mlc-ai/web-llm)). No server is involved, and conversations never leave the device.

- **Model:** Llama-3.2-3B on stronger GPUs, Llama-3.2-1B on phones, low-memory devices and Intel integrated graphics. The choice is automatic; see `src/services/modelConfig.js` and `pickModel()` in `src/services/releviaBrain.js`.
- **First visit:** a one-time download (about 0.9 GB or 2.3 GB), cached by the browser. Until it's ready, Relevia answers instantly with curated offline replies.
- **No WebGPU** (older browsers, most of Firefox and Safari): offline replies only.
- **Safety:** crisis messages are caught on-device before any AI runs (`src/services/safety.js`) and always get crisis-line information.
- **Speed check:** in `npm run dev`, every reply logs `[Relevia] Speed: prefill … decoding … tokens/sec` in the browser console.
- **Using a fine-tuned model:** train and export it with `relevia-research/notebooks/train_for_app.ipynb`, then paste the printed `CUSTOM_MODEL` into `src/services/modelConfig.js`.

## Deploying

```bash
npm run deploy
```

This builds with the `/relevia/` base path for GitHub Pages and publishes `dist/` to the `gh-pages` branch. Plain `npm run build` builds for the site root (`/`), for example Vercel.

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request.

Please follow the existing code style and include tests where applicable.

## Contact

For support or collaboration, reach out via:

- **Website**: [EmpowerED Global](https://empoweredglobal.org)
- **Email**: empoweredhelpline@gmail.com
- **WhatsApp**: +8801340100676
- **Facebook**: [EmpowerED Global](https://facebook.com/empoweredglobal)

> _This project is a small effort from EmpowerED Global to raise awareness about panic attacks._

