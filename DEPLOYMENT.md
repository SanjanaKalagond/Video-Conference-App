# Azure Deployment Guide - Video Conference App

This guide covers the complete setup for deploying your Next.js video conference application to Azure using containerized deployment with CI/CD via GitHub Actions.

## Prerequisites

1. **Azure CLI** - Install from [here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
2. **Docker** - For local testing (optional)
3. **GitHub Account** - For CI/CD pipeline
4. **Azure Subscription** - Active subscription required

## Architecture Overview

- **Azure Container Registry (ACR)**: Stores Docker images
- **Azure Web App for Containers**: Hosts the containerized application
- **Azure Key Vault**: Securely stores sensitive environment variables
- **GitHub Actions**: Automates CI/CD pipeline

## Part 1: Azure Infrastructure Setup

### Option A: Automated Setup (Recommended)

Run the provided setup script:

```bash
./azure-setup.sh
```

This script will:
1. Create a Resource Group
2. Set up Azure Container Registry (ACR)
3. Create an App Service Plan
4. Deploy Azure Web App for Containers
5. Configure Azure Key Vault with your secrets
6. Set up Managed Identity for secure secret access
7. Create Service Principal for GitHub Actions
8. Output all necessary credentials

**IMPORTANT**: Save all the output credentials - you'll need them for GitHub Secrets!

### Option B: Manual Setup

If you prefer manual setup, follow these steps:

#### 1. Login to Azure
```bash
az login
```

#### 2. Create Resource Group
```bash
RESOURCE_GROUP="video-conference-rg"
LOCATION="eastus"

az group create --name $RESOURCE_GROUP --location $LOCATION
```

#### 3. Create Azure Container Registry
```bash
ACR_NAME="yourregistryname"  # Must be globally unique, alphanumeric only

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

#### 4. Get ACR Credentials
```bash
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query "loginServer" -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"
```

#### 5. Create App Service Plan
```bash
APP_SERVICE_PLAN="video-conference-plan"

az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1
```

#### 6. Create Web App
```bash
WEBAPP_NAME="your-webapp-name"  # Must be globally unique

az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEBAPP_NAME \
  --deployment-container-image-name $ACR_LOGIN_SERVER/video-conference-app:latest
```

#### 7. Configure Web App to use ACR
```bash
az webapp config container set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name $ACR_LOGIN_SERVER/video-conference-app:latest \
  --docker-registry-server-url https://$ACR_LOGIN_SERVER \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD
```

#### 8. Create Azure Key Vault
```bash
KEY_VAULT_NAME="your-keyvault-name"  # Must be globally unique

az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

#### 9. Store Secrets in Key Vault
```bash
# Replace with your actual values
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "CLERK-SECRET-KEY" --value "your_clerk_secret"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "STREAM-SECRET-KEY" --value "your_stream_secret"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "NEXT-PUBLIC-CLERK-PUBLISHABLE-KEY" --value "your_clerk_public_key"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "NEXT-PUBLIC-STREAM-API-KEY" --value "your_stream_api_key"
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "NEXT-PUBLIC-BASE-URL" --value "https://$WEBAPP_NAME.azurewebsites.net"
```

#### 10. Enable Managed Identity
```bash
az webapp identity assign \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP

WEBAPP_IDENTITY=$(az webapp identity show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)
```

#### 11. Grant Web App Access to Key Vault
```bash
az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $WEBAPP_IDENTITY \
  --secret-permissions get list
```

#### 12. Configure App Settings
```bash
VAULT_URI=$(az keyvault show --name $KEY_VAULT_NAME --query properties.vaultUri -o tsv)

az webapp config appsettings set \
  --name $WEBAPP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    CLERK_SECRET_KEY="@Microsoft.KeyVault(SecretUri=${VAULT_URI}secrets/CLERK-SECRET-KEY/)" \
    STREAM_SECRET_KEY="@Microsoft.KeyVault(SecretUri=${VAULT_URI}secrets/STREAM-SECRET-KEY/)" \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="@Microsoft.KeyVault(SecretUri=${VAULT_URI}secrets/NEXT-PUBLIC-CLERK-PUBLISHABLE-KEY/)" \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in" \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up" \
    NEXT_PUBLIC_STREAM_API_KEY="@Microsoft.KeyVault(SecretUri=${VAULT_URI}secrets/NEXT-PUBLIC-STREAM-API-KEY/)" \
    NEXT_PUBLIC_BASE_URL="@Microsoft.KeyVault(SecretUri=${VAULT_URI}secrets/NEXT-PUBLIC-BASE-URL/)" \
    WEBSITES_PORT=3000
```

#### 13. Create Service Principal for GitHub Actions
```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name "github-actions-$WEBAPP_NAME" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
  --sdk-auth
```

Save the JSON output - you'll need it for GitHub!

## Part 2: GitHub Configuration

### 1. Add GitHub Secrets

Go to your GitHub repository: **Settings > Secrets and variables > Actions > New repository secret**

Add the following secrets:

| Secret Name | Value | Source |
|------------|-------|--------|
| `ACR_LOGIN_SERVER` | Your ACR login server URL | From step 4 or azure-setup.sh output |
| `ACR_USERNAME` | ACR username | From step 4 or azure-setup.sh output |
| `ACR_PASSWORD` | ACR password | From step 4 or azure-setup.sh output |
| `AZURE_CREDENTIALS` | Complete JSON output | From step 13 or azure-setup.sh output |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key | From .env.local |
| `NEXT_PUBLIC_STREAM_API_KEY` | Your Stream API key | From .env.local |
| `NEXT_PUBLIC_BASE_URL` | Your production URL | https://your-webapp-name.azurewebsites.net |

### 2. Update GitHub Workflow

Edit `.github/workflows/azure-deploy.yml` and update the `AZURE_WEBAPP_NAME` environment variable:

```yaml
env:
  AZURE_WEBAPP_NAME: your-actual-webapp-name  # Update this!
  NODE_VERSION: '20.x'
```

## Part 3: Initial Deployment

### Option 1: Manual First Deploy

Build and push your first Docker image manually:

```bash
# Build the image
docker build -t $ACR_LOGIN_SERVER/video-conference-app:latest \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_value" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in" \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up" \
  --build-arg NEXT_PUBLIC_STREAM_API_KEY="your_value" \
  --build-arg NEXT_PUBLIC_BASE_URL="your_value" \
  .

# Login to ACR
docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME -p $ACR_PASSWORD

# Push the image
docker push $ACR_LOGIN_SERVER/video-conference-app:latest
```

### Option 2: Trigger GitHub Actions

Simply push to the main branch:

```bash
git add .
git commit -m "Setup Azure deployment"
git push origin main
```

The GitHub Actions workflow will automatically:
1. Run tests and linting
2. Build the Docker image
3. Push to Azure Container Registry
4. Deploy to Azure Web App

## Part 4: Local Testing (Optional)

Test your Docker setup locally before deploying:

```bash
# Using docker-compose
docker-compose up --build

# Or using Docker directly
docker build -t video-conference-app .
docker run -p 3000:3000 --env-file .env.local video-conference-app
```

Visit `http://localhost:3000` to test.

## Monitoring and Management

### View Application Logs
```bash
az webapp log tail --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

### View Deployment Status
```bash
az webapp deployment list-publishing-profiles --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

### Restart Web App
```bash
az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

### Access Application
Your app will be available at: `https://your-webapp-name.azurewebsites.net`

## CI/CD Pipeline Flow

1. **Developer pushes code** to main branch
2. **GitHub Actions triggers**:
   - Checkout code
   - Install dependencies
   - Run linter
   - Build Next.js app
3. **Docker image build**:
   - Build with Next.js standalone output
   - Tag with commit SHA and latest
   - Push to Azure Container Registry
4. **Azure deployment**:
   - Azure Web App pulls new image
   - Restarts with new container
   - Environment variables loaded from Key Vault

## Troubleshooting

### Issue: Container fails to start

**Check logs:**
```bash
az webapp log tail --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

**Common causes:**
- Missing environment variables
- Port configuration (ensure WEBSITES_PORT=3000)
- Key Vault access issues

### Issue: Key Vault access denied

**Verify Managed Identity:**
```bash
az webapp identity show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

**Re-grant permissions:**
```bash
WEBAPP_IDENTITY=$(az webapp identity show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --query principalId -o tsv)
az keyvault set-policy --name $KEY_VAULT_NAME --object-id $WEBAPP_IDENTITY --secret-permissions get list
```

### Issue: GitHub Actions fails

**Verify secrets are set correctly:**
- Check all required secrets are added
- Ensure AZURE_CREDENTIALS JSON is valid
- Verify ACR credentials are correct

### Issue: Image pull fails

**Check ACR integration:**
```bash
az webapp config container show --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

## Security Best Practices

1. **Never commit .env files** - Already in .dockerignore
2. **Use Key Vault** - All secrets stored securely
3. **Managed Identity** - No credentials in code
4. **RBAC** - Service Principal has minimum required permissions
5. **Update dependencies regularly** - Use Dependabot
6. **Enable Azure Security Center** - Monitor for threats

## Cost Optimization

- **B1 App Service Plan**: ~$13/month
- **Basic ACR**: ~$5/month
- **Key Vault**: Pay per operation (minimal for small apps)

**Total estimated cost**: ~$20-25/month

To reduce costs:
- Use F1 Free tier for testing (limitations apply)
- Delete resources when not in use
- Use Azure Cost Management tools

## Updating Environment Variables

To update secrets after deployment:

```bash
# Update in Key Vault
az keyvault secret set --vault-name $KEY_VAULT_NAME --name "SECRET-NAME" --value "new_value"

# Restart Web App to reload secrets
az webapp restart --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP
```

## Scaling

### Vertical Scaling (Upgrade Plan)
```bash
az appservice plan update --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku S1
```

### Horizontal Scaling (More Instances)
```bash
az appservice plan update --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --number-of-workers 3
```

## Clean Up Resources

To delete all resources and stop charges:

```bash
az group delete --name $RESOURCE_GROUP --yes --no-wait
```

## Support

For issues:
- Azure documentation: https://docs.microsoft.com/azure
- Next.js deployment: https://nextjs.org/docs/deployment
- GitHub Actions: https://docs.github.com/actions

## Next Steps

1. Set up custom domain
2. Configure SSL certificate
3. Set up Application Insights for monitoring
4. Configure auto-scaling rules
5. Set up staging slots for zero-downtime deployments
