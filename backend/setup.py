from setuptools import setup, find_packages

setup(
    name="agent-binod",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.109.2",
        "uvicorn[standard]==0.27.1",
        "python-jose[cryptography]==3.3.0",
        "python-multipart==0.0.9",
        "pydantic==2.6.1",
        "pydantic-settings==2.1.0",
        "supabase==1.2.0",
        "httpx==0.24.1",
        "python-dotenv==1.0.1",
        "anthropic==0.18.1",
        "langchain==0.1.0",
        "langchain-anthropic==0.1.1"
    ],
    python_requires=">=3.9",
) 