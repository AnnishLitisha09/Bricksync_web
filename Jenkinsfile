
pipeline {
    agent {
        label 'docker-agent'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        COMPOSE_PROJECT = 'bricksync'
        COMPOSE_FILE = 'docker-compose.yml'
        ENV_CREDENTIAL = 'bricksync-env'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/AnnishLitisha09/Bricksync_web.git'
            }
        }

        stage('Verify Docker') {
            steps {
                sh '''
                    set -eu
                    docker version
                    docker compose version

                    test -f backend/Dockerfile
                    test -f backend/.dockerignore
                    test -f backend/package.json
                    test -f backend/package-lock.json
                    test -f docker-compose.yml

                    echo "Deployment files verified."
                '''
            }
        }

        stage('Validate Configuration') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'bricksync-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -eu

                        cp "$ENV_FILE" backend/.env
                        trap 'rm -f backend/.env' EXIT

                        docker compose \
                            -p "$COMPOSE_PROJECT" \
                            -f "$COMPOSE_FILE" \
                            config --quiet

                        echo "Compose configuration validated."
                    '''
                }
            }
        }

        stage('Build Backend') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'bricksync-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -eu

                        cp "$ENV_FILE" backend/.env
                        trap 'rm -f backend/.env' EXIT

                        docker compose \
                            -p "$COMPOSE_PROJECT" \
                            -f "$COMPOSE_FILE" \
                            build backend

                        echo "Backend image built."
                    '''
                }
            }
        }

        stage('Deploy Backend') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'bricksync-env',
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        set -eu

                        cp "$ENV_FILE" backend/.env
                        trap 'rm -f backend/.env' EXIT

                        docker compose \
                            -p "$COMPOSE_PROJECT" \
                            -f "$COMPOSE_FILE" \
                            up -d --no-deps --no-build backend

                        echo "Backend deployment completed."
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -eu

                    for attempt in $(seq 1 24); do
                        STATUS=$(docker inspect \
                            --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
                            bricksync-backend 2>/dev/null || true)

                        if [ "$STATUS" = "healthy" ]; then
                            docker exec bricksync-backend node -e "
                                fetch('http://127.0.0.1:5000/')
                                    .then(async r => {
                                        console.log('HTTP Status:', r.status);
                                        console.log(await r.text());
                                        if (!r.ok) process.exitCode = 1;
                                    })
                                    .catch(e => {
                                        console.error(e);
                                        process.exitCode = 1;
                                    });
                            "

                            echo "Backend health check passed."
                            exit 0
                        fi

                        echo "Waiting for backend: attempt $attempt"
                        sleep 5
                    done

                    echo "Backend health check failed."
                    docker logs --tail 80 bricksync-backend
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo 'BrickSync backend deployed successfully!'
        }

        failure {
            echo 'Deployment failed. Check Console Output.'
        }

        always {
            sh 'rm -f backend/.env || true'
        }
    }
}
