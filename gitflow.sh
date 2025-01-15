#!/bin/bash

sf() {
    if [ -z "$1" ]; then
        echo "Error: Feature name is required"
        echo "Usage: ./gitflow.sh sf <feature-name>"
        exit 1
    fi

    feature_name=$1
    
    git checkout master
    git pull origin master
    git checkout -b "feature/$feature_name"
    
    echo "Created and switched to new feature branch: feature/$feature_name"
}

mf() {
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    
    if [[ $current_branch != feature/* ]]; then
        echo "Error: Not on a feature branch"
        echo "Current branch: $current_branch"
        exit 1
    fi
    
    git pull origin $current_branch || true
    git checkout master
    git pull origin master
    git merge "$current_branch"
    git push origin master
    git branch -d "$current_branch"
    git push origin --delete "${current_branch}"
    
    echo "Successfully merged $current_branch into master and deleted the feature branch"
}

case "$1" in
    "sf")
        sf "$2"
        ;;
    "mf")
        mf
        ;;
    *)
        echo "Usage: ./gitflow.sh <command> [options]"
        echo "Commands:"
        echo "  sf <feature-name>  - Create a new feature branch"
        echo "  mf                 - Merge current feature branch into master"
        exit 1
        ;;
esac 