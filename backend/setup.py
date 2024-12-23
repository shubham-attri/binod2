from setuptools import setup, find_packages

setup(
    name="agent-binod",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi>=0.109.2",
        "uvicorn[standard]>=0.27.1",
        "python-jose[cryptography]>=3.3.0",
        "redis==5.0.1",
        "anthropic==0.18.1",
        "langchain==0.1.6",
        "langchain-anthropic==0.1.1",
        "langchain-core==0.1.22",
        "python-multipart>=0.0.9",
        "pydantic>=2.6.1",
        "pydantic-settings==2.1.0",
        "python-dotenv==1.0.0",
        "httpx==0.25.2",
        "supabase-py==2.3.4"
    ],
    python_requires=">=3.9",
) 