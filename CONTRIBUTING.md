# Contributing to Sharepoint Video Catcher

Thank you for your interest in contributing to Sharepoint Video Catcher! This document provides guidelines and instructions for contributing to this project.

## Getting Started

1. Fork the repository and clone it locally
2. Load the extension in developer mode in Chrome or Edge
3. Make your changes
4. Test the changes thoroughly
5. Submit a pull request

## Development Setup

### Prerequisites

- Chrome or Edge browser
- Basic knowledge of JavaScript, HTML, and CSS
- Git

### Local Development

1. Clone the repository:
```
git clone https://github.com/hoangsao/sharepoint-video-catcher.git
```

2. Open Chrome/Edge and go to the Extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the cloned repository folder

5. The extension should now be loaded and ready for testing

## Testing

Before submitting a pull request, please test your changes in the following scenarios:

1. On a Sharepoint site with videos
2. With various video formats and page layouts
3. Test both the automatic detection and the copy functionality
4. Ensure the ffmpeg commands work correctly

## Coding Guidelines

- Follow standard JavaScript practices
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Test in both Chrome and Edge browsers

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the version number in manifest.json following [SemVer](http://semver.org/)
3. Create a pull request with a clear description of the changes
4. The pull request will be reviewed and merged if approved

## Feature Requests and Bug Reports

If you have ideas for new features or have found bugs, please open an issue on the GitHub repository with the following information:

- Clear description of the feature/bug
- Steps to reproduce (for bugs)
- Expected behavior
- Screenshots (if applicable)
- Browser version
- Operating system

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community for all contributors.

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT).
