pipeline {
    agent any

    triggers {
     pollSCM('') // Enabling being build on Push
    }

    stages {
        stage('COMPILE') {
            steps {
                sh 'sudo su - root -c "cd /var/lib/jenkins/workspace/metarchy && cd frontend && npm install && npm run dev && pm2 restart metarchy"'
            }
        }
    }
}
