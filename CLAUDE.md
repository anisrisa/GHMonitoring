# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project provides visibility into GitHub tasks (issues/pull requests) and tracks which ones were picked up and completed by the tech team. The goal is to monitor task assignment, progress, and completion status.

## Project Architecture

This is a new project. The recommended architecture should include:

### Core Components

1. **GitHub API Integration**
   - Authenticate with GitHub API (using personal access tokens or GitHub App)
   - Fetch issues and pull requests from target repositories
   - Track issue/PR status, assignees, and labels
   - Monitor state changes (opened, assigned, in progress, completed)

2. **Data Storage**
   - Store historical data about tasks (issues/PRs)
   - Track assignments and state transitions
   - Record completion dates and assignee information

3. **Dashboard/Reporting**
   - Visualize task pickup rates by team members
   - Show completion metrics and timelines
   - Display current task status across repositories

4. **Task State Management**
   - Define task lifecycle: created → assigned → in progress → completed
   - Map GitHub labels/events to internal state model
   - Handle edge cases (reassignments, reopened issues)

## Technology Stack Considerations

When implementing this project, consider:

- **Backend**: Node.js/Python for GitHub API integration and data processing
- **Database**: PostgreSQL/MongoDB for historical task data
- **API Framework**: Express/FastAPI for exposing metrics
- **Frontend**: React/Vue for dashboard visualization
- **GitHub Integration**: Octokit (JS) or PyGithub (Python) libraries

## GitHub API Integration Notes

- Use webhook listeners for real-time updates rather than polling
- Key events to track:
  - `issues` (opened, assigned, closed, reopened)
  - `pull_request` (opened, assigned, closed, review_requested)
  - `issue_comment` and `pull_request_review` for activity tracking
- Rate limits: GitHub API allows 5000 requests/hour for authenticated requests
- Consider using GitHub App installation tokens for better rate limits

## Data Model Considerations

Essential entities to track:

- **Tasks**: GitHub issue/PR ID, repository, title, created date, labels
- **Assignments**: task ID, assignee, assignment date, unassignment date
- **State Transitions**: task ID, from state, to state, timestamp
- **Team Members**: GitHub username, name, team affiliation
- **Completion Metrics**: task ID, completed date, time to completion, assignee

## Development Workflow

Once the codebase is established, document here:
- How to set up local development environment
- How to configure GitHub authentication
- How to run the application
- How to run tests
- Database migration commands
