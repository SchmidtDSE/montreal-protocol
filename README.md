
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

- **ANTLR4**: For parsing the QubecTalk domain-specific language
- **D3.js**: For data visualization
- **Chart.js**: For rendering charts and graphs
- **ACE Editor**: For the code editing interface
- **QUnit**: For unit testing
- **Webpack**: For bundling JavaScript modules
- **ESLint**: For code style enforcement
- **Public Sans**: Font family for UI elements
- **Tabby**: For tab interface management

## License

This project's code is available under the BSD license. The QubecTalk language documentation is available under the Creative Commons CC-BY 4.0 International License.
