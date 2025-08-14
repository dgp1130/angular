#!/usr/bin/env bash

# This script builds Angular DevTools inside a container using buildah.
# It creates a container, installs dependencies, copies the source code,
# runs the build, and extracts the build artifacts.

set -euox pipefail

# --- Configuration ---
# The base container image to use.
readonly BASE_IMAGE="debian:trixie-slim"
# The directory inside the container where the repository will be copied.
readonly REPO_DIR="/devtools-repo"
# The directory where build artifacts will be copied on the host.
readonly OUTPUT_DIR="./dist/devtools"
# --- End Configuration ---

# Check for root privileges, required by buildah.
if [[ "$(id -u)" -ne 0 ]]; then
  echo "This script uses buildah and must be run as root or with sudo."
  exit 1
fi

echo "Starting DevTools build in a container..."

# Create a new container from the base image.
# The --pull flag ensures we have the latest image.
readonly CONTAINER=$(buildah from --pull "${BASE_IMAGE}")

# Function to clean up the container on script exit or interruption.
function cleanup {
  echo "Cleaning up build container..."
  # The '|| true' prevents the script from failing if the container was already removed.
  buildah rm "${CONTAINER}" || true
}
trap cleanup EXIT

echo "Container ${CONTAINER} created."

# Configure the working directory in the container.
buildah config --workingdir "${REPO_DIR}" "${CONTAINER}"

# Copy the project source code into the container.
# We ignore .git and files from .gitignore to keep the container lean.
echo "Copying source code into the container..."
buildah copy --contextdir . --ignorefile .gitignore --exclude .git "${CONTAINER}" . "${REPO_DIR}"

# Install build dependencies inside the container.
echo "Installing dependencies (curl, git)..."
buildah run "${CONTAINER}" -- apt-get update
buildah run "${CONTAINER}" -- apt-get install -y curl

# Install nvm (Node Version Manager).
echo "Installing nvm..."
buildah run "${CONTAINER}" -- bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"

# Define a helper for running commands within the nvm shell environment.
# Each 'buildah run' is a new shell, so we need to source nvm each time.
readonly NVM="\$HOME/.nvm/nvm.sh"

# Install Node.js and npm using nvm.
echo "Installing Node.js..."
buildah run "${CONTAINER}" -- bash
buildah run --debug "${CONTAINER}" -- bash -c "source ${NVM} && nvm install"
buildah run --debug "${CONTAINER}" -- node --version
exit 0

# Install pnpm, which is used by the Angular repository.
echo "Installing pnpm..."
buildah run "${CONTAINER}" -- ${NVM_EXEC} npm install -g pnpm'

# Install project dependencies using pnpm.
echo "Installing project dependencies with pnpm..."
buildah run "${CONTAINER}" -- ${NVM_EXEC} pnpm install'

# Run the build command for DevTools.
# This might need to be adjusted based on the actual build script in package.json.
echo "Building Angular DevTools..."
buildah run "${CONTAINER}" -- ${NVM_EXEC} pnpm run devtools:build:chrome:release'

# Extract build artifacts from the container.
echo "Extracting build artifacts..."

# Mount the container's filesystem.
readonly MOUNT_POINT=$(buildah mount "${CONTAINER}")

# Ensure the mount point is unmounted on script exit.
function unmount {
  echo "Unmounting container filesystem..."
  buildah unmount "${CONTAINER}" || true
}
trap unmount EXIT

# Create the output directory on the host and copy the artifacts.
echo "Copying artifacts to ${OUTPUT_DIR}..."
mkdir -p "${OUTPUT_DIR}"
cp -r "${MOUNT_POINT}${REPO_DIR}/dist/." "${OUTPUT_DIR}/"

echo ""
echo "✅ Angular DevTools build complete!"
echo "Artifacts are available in: ${OUTPUT_DIR}"

