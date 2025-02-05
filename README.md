
# Montreal Policy Simulation

Online open source engine for business as usual and policy simulation on HFCs. This tool enables exploration and analysis of potential outcomes for multiple substances and applications under different scenarios.

## Purpose

This application provides a domain-specific language (QubecTalk) and simulation engine for modeling and analyzing policies related to the Montreal Protocol. It helps evaluate and compare different intervention options by simulating longitudinal projections of applications, substances, and their interactions.

## Usage

1. Open the application in your web browser
2. Use either the Basic (UI-based) or Advanced (code-based) editor to define your simulation
3. Click Run to execute the simulation
4. View results in the visualization panel, which shows:
   - Consumption metrics
   - Sales data
   - Equipment population statistics

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
bash ./support/install_deps.sh
```

3. Build the project:
```bash
bash ./support/make.sh
```

## Deployment

This project can be deployed using Replit. Simply:

1. Push your changes to the repository
2. In Replit's interface, click the "Deploy" button
3. Choose deployment settings as needed

The deployment process is automated through GitHub Actions as defined in `.github/workflows/build.yaml`.

## Development Standards

- Use ESLint for code style enforcement
- Follow Google JavaScript Style Guide conventions
- Write unit tests for new features using QUnit
- Keep functions focused and single-purpose
- Document code using JSDoc comments
- Run tests before committing changes

## Open Source Technologies Used

- **ANTLR4** ([BSD-3](https://www.antlr.org/license.html) - [Homepage](https://www.antlr.org/)): For parsing the QubecTalk domain-specific language
- **D3.js** ([ISC](https://github.com/d3/d3/blob/main/LICENSE) - [Homepage](https://d3js.org/)): For data visualization
- **Chart.js** ([MIT](https://github.com/chartjs/Chart.js/blob/master/LICENSE.md) - [Homepage](https://www.chartjs.org/)): For rendering charts and graphs
- **ACE Editor** ([BSD-3](https://github.com/ajaxorg/ace/blob/master/LICENSE) - [Homepage](https://ace.c9.io/)): For the code editing interface
- **QUnit** ([MIT](https://github.com/qunitjs/qunit/blob/main/LICENSE.txt) - [Homepage](https://qunitjs.com/)): For unit testing
- **Webpack** ([MIT](https://github.com/webpack/webpack/blob/main/LICENSE) - [Homepage](https://webpack.js.org/)): For bundling JavaScript modules
- **ESLint** ([MIT](https://github.com/eslint/eslint/blob/main/LICENSE) - [Homepage](https://eslint.org/)): For code style enforcement
- **Public Sans** ([OFL-1.1](https://github.com/uswds/public-sans/blob/master/LICENSE.md) - [Homepage](https://public-sans.digital.gov/)): Font family for UI elements 
- **Tabby** ([MIT](https://github.com/cferdinandi/tabby/blob/master/LICENSE.md) - [Homepage](https://github.com/cferdinandi/tabby)): For tab interface management

## License

This project's code is available under the BSD license. The QubecTalk language documentation is available under the Creative Commons CC-BY 4.0 International License.
