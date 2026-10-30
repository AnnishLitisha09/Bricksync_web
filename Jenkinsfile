pipeline {
    agent any

    triggers {
        // Poll SCM repository every 5 minutes for new commits
        pollSCM('H/5 * * * *')
    }

    environment {
        IMAGE_NAME = 'bricksync-backend'
        CONTAINER_NAME = 'bricksync-backend'
        PORT = '5000'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out latest code from SCM...'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Backend Docker Image (${IMAGE_NAME}:latest)..."
                sh 'docker build -t ${IMAGE_NAME}:latest -f backend/Dockerfile ./backend'
            }
        }

        stage('Deploy & Migrate') {
            steps {
                echo 'Stopping existing backend container...'
                sh 'docker stop ${CONTAINER_NAME} || true'
                sh 'docker rm ${CONTAINER_NAME} || true'

                echo 'Deploying new backend container with automated migrations...'
                sh '''
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p ${PORT}:${PORT} \
                        --add-host=host.docker.internal:host-gateway \
                        --env-file backend/.env \
                        ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo 'Waiting for service initialization...'
                sh 'sleep 6'
                sh 'docker ps --filter name=${CONTAINER_NAME}'
                sh 'docker logs --tail 30 ${CONTAINER_NAME}'
            }
        }
    }

    post {
        success {
            echo "Bricksync Backend deployed successfully! Running on port ${PORT}."
        }
        failure {
            echo "Deployment failed! Inspecting recent container logs:"
            sh 'docker logs --tail 50 ${CONTAINER_NAME} || true'
        }
    }
}
