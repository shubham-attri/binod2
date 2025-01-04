#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch name
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)



# # 1. Sync with main
# echo -e "${YELLOW}Syncing with main...${NC}"
# git checkout main
# git pull origin main
# git checkout $BRANCH_NAME
# git merge main

# 2. Stage and commit changes
echo -e "${YELLOW}Staging changes...${NC}"
git add .

# Prompt for commit message
echo -e "${YELLOW}Enter commit message:${NC}"
read commit_msg
git commit -m "$commit_msg"

# 3. Push to remote and set upstream
echo -e "${YELLOW}Pushing to remote...${NC}"
git push --set-upstream origin $BRANCH_NAME

# 4. Create PR using GitHub CLI
echo -e "${YELLOW}Creating Pull Request...${NC}"
echo -e "${YELLOW}Enter PR title:${NC}"
read pr_title
echo -e "${YELLOW}Enter PR description (press Ctrl+D when done):${NC}"
pr_body=$(cat)

# Create PR and capture the PR number
pr_url=$(gh pr create --base main --head $BRANCH_NAME --title "$pr_title" --body "$pr_body")
pr_number=$(echo $pr_url | grep -o '[0-9]*$')

echo -e "${GREEN}PR created successfully!${NC}"

# 5. Enable auto-merge and merge the PR
echo -e "${YELLOW}Enabling auto-merge and merging PR...${NC}"
gh pr merge $pr_number --auto --merge

# 6. Switch back to main and pull changes
echo -e "${YELLOW}Switching to main and pulling changes...${NC}"
git checkout main
git pull origin main

# 7. Switch back to feature branch
echo -e "${YELLOW}Switching back to ${BRANCH_NAME}...${NC}"
git checkout $BRANCH_NAME

echo -e "${GREEN}All done! PR has been merged. You're now on branch ${BRANCH_NAME}${NC}" 