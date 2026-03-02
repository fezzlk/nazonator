#!/usr/bin/env bash
# =============================================================================
# setup-gcp.sh  —  nazonator GCP インフラ初回構築スクリプト (冪等性あり)
#
# 実行前提:
#   - gcloud CLI がインストール・ログイン済み
#   - GitHub リポジトリ: fezzlk/nazonator
#   - GCP プロジェクト: nazonator (既存)
# =============================================================================
set -euo pipefail

PROJECT_ID="nazonator"
REGION="asia-northeast1"
REPO_NAME="nazonator"
RUN_SA="nazonator-run"
GITHUB_OWNER="fezzlk"
GITHUB_REPO="nazonator"
CONNECTION_NAME="nazonator-github"

echo "=== [0] GCP プロジェクト設定 ==="
gcloud config set project "${PROJECT_ID}"
gcloud config set compute/region "${REGION}"

echo ""
echo "=== [1] API 有効化 ==="
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  --project="${PROJECT_ID}"
echo "APIs enabled."

echo ""
echo "=== [2] Artifact Registry リポジトリ作成 ==="
if gcloud artifacts repositories describe "${REPO_NAME}" \
     --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Artifact Registry repo '${REPO_NAME}' already exists. Skipping."
else
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="nazonator Docker images"
  echo "Created Artifact Registry repo: ${REPO_NAME}"
fi

echo ""
echo "=== [3] Secret Manager シークレット作成 ==="
SECRETS=(
  "openai-api-key"
  "firebase-api-key"
  "firebase-auth-domain"
  "firebase-project-id"
  "firebase-storage-bucket"
  "firebase-messaging-sender-id"
  "firebase-app-id"
)
for secret in "${SECRETS[@]}"; do
  if gcloud secrets describe "${secret}" --project="${PROJECT_ID}" &>/dev/null; then
    echo "Secret '${secret}' already exists. Skipping."
  else
    # 空の初期バージョンで作成（後で値を設定する）
    echo -n "placeholder" | gcloud secrets create "${secret}" \
      --data-file=- \
      --project="${PROJECT_ID}"
    echo "Created secret: ${secret}"
  fi
done

echo ""
echo "=== [4] Cloud Build サービスアカウントへの権限付与 ==="
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
# Cloud Build P4SA (サービスエージェント) — GitHub 接続作成に必要
CLOUDBUILD_P4SA="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"

CLOUDBUILD_ROLES=(
  "roles/artifactregistry.writer"
  "roles/run.admin"
  "roles/secretmanager.secretAccessor"
  "roles/iam.serviceAccountUser"
)
for role in "${CLOUDBUILD_ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${CLOUDBUILD_SA}" \
    --role="${role}" \
    --condition=None \
    --quiet
  echo "Granted ${role} to Cloud Build SA"
done

# P4SA に Secret Manager 管理権限を付与 (GitHub 接続作成に必要)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_P4SA}" \
  --role="roles/secretmanager.admin" \
  --condition=None \
  --quiet
echo "Granted roles/secretmanager.admin to Cloud Build P4SA"

echo ""
echo "=== [5] Cloud Run 専用サービスアカウント作成 ==="
if gcloud iam service-accounts describe "${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
     --project="${PROJECT_ID}" &>/dev/null; then
  echo "Service account '${RUN_SA}' already exists. Skipping."
else
  gcloud iam service-accounts create "${RUN_SA}" \
    --display-name="nazonator Cloud Run SA" \
    --project="${PROJECT_ID}"
  echo "Created service account: ${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com"
fi

# openai-api-key のみアクセス権を付与
gcloud secrets add-iam-policy-binding "openai-api-key" \
  --member="serviceAccount:${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project="${PROJECT_ID}" \
  --quiet
echo "Granted secretAccessor on openai-api-key to ${RUN_SA}"

echo ""
echo "=== [6] Cloud Build GitHub 接続作成 ==="
echo "NOTE: この手順でブラウザが開き、GitHub OAuth 認可が必要になります（1回のみ）"
if gcloud builds connections describe "${CONNECTION_NAME}" \
     --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Connection '${CONNECTION_NAME}' already exists. Skipping."
else
  gcloud builds connections create github "${CONNECTION_NAME}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}"
  echo "Created GitHub connection: ${CONNECTION_NAME}"
fi

echo ""
echo "=== [7] Cloud Build リポジトリリンク作成 ==="
REPO_LINK="${CONNECTION_NAME}-${GITHUB_REPO}"
if gcloud builds repositories describe "${REPO_LINK}" \
     --connection="${CONNECTION_NAME}" \
     --region="${REGION}" \
     --project="${PROJECT_ID}" &>/dev/null; then
  echo "Repository link '${REPO_LINK}' already exists. Skipping."
else
  gcloud builds repositories create "${REPO_LINK}" \
    --remote-uri="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" \
    --connection="${CONNECTION_NAME}" \
    --region="${REGION}" \
    --project="${PROJECT_ID}"
  echo "Created repository link: ${REPO_LINK}"
fi

echo ""
echo "=== [8] Cloud Build トリガー作成 ==="
TRIGGER_NAME="nazonator-release-deploy"
if gcloud builds triggers describe "${TRIGGER_NAME}" \
     --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Trigger '${TRIGGER_NAME}' already exists. Skipping."
else
  gcloud builds triggers create github \
    --name="${TRIGGER_NAME}" \
    --region="${REGION}" \
    --repository="projects/${PROJECT_ID}/locations/${REGION}/connections/${CONNECTION_NAME}/repositories/${REPO_LINK}" \
    --branch-pattern="^release$" \
    --build-config="cloudbuild.yaml" \
    --project="${PROJECT_ID}"
  echo "Created trigger: ${TRIGGER_NAME}"
fi

echo ""
echo "=== [9] Cloud Run サービス初回 placeholder デプロイ ==="
if gcloud run services describe "${REPO_NAME}" \
     --region="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "Cloud Run service '${REPO_NAME}' already exists. Skipping."
else
  gcloud run deploy "${REPO_NAME}" \
    --image="us-docker.pkg.dev/cloudrun/container/hello" \
    --region="${REGION}" \
    --memory="512Mi" \
    --cpu="1" \
    --min-instances=0 \
    --max-instances=10 \
    --allow-unauthenticated \
    --service-account="${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
    --project="${PROJECT_ID}"
  echo "Created placeholder Cloud Run service: ${REPO_NAME}"
fi

echo ""
echo "======================================================================"
echo "セットアップ完了！"
echo ""
echo "次のステップ: 各シークレットに実際の値を設定してください"
echo ""
echo "--- OpenAI API Key ---"
echo "echo -n 'YOUR_OPENAI_API_KEY' | gcloud secrets versions add openai-api-key --data-file=- --project=${PROJECT_ID}"
echo ""
echo "--- Firebase Config ---"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-api-key --data-file=- --project=${PROJECT_ID}"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-auth-domain --data-file=- --project=${PROJECT_ID}"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-project-id --data-file=- --project=${PROJECT_ID}"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-storage-bucket --data-file=- --project=${PROJECT_ID}"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-messaging-sender-id --data-file=- --project=${PROJECT_ID}"
echo "echo -n 'YOUR_VALUE' | gcloud secrets versions add firebase-app-id --data-file=- --project=${PROJECT_ID}"
echo ""
echo "全シークレット設定後、release ブランチを push してデプロイを開始:"
echo "  git checkout -b release && git push -u origin release"
echo ""
echo "デプロイ後、Cloud Run URL を Firebase Auth の承認済みドメインに追加することを忘れずに！"
echo "======================================================================"
