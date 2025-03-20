from jinja2 import Template
import difflib
import json
import uuid
from datetime import datetime
import os
from typing import Dict, Any, Tuple, Optional, List
from loguru import logger

from ..utils.redis_client import redis_client

# Template examples for legal documents
templates = {
    "nda": """
    NON-DISCLOSURE AGREEMENT

    This Non-Disclosure Agreement (the "Agreement") is entered into as of {{ effective_date }} by and between {{ party_a }}, and {{ party_b }}.

    1. CONFIDENTIAL INFORMATION
    {{ confidential_info_definition }}

    2. OBLIGATIONS OF RECEIVING PARTY
    {{ obligations }}

    3. TERM
    {{ term }}

    SIGNATURES:
    
    {{ party_a }}                               {{ party_b }}
    ___________________                         ___________________
    """,
    
    "contract": """
    SERVICE AGREEMENT

    This Service Agreement (the "Agreement") is entered into as of {{ effective_date }} by and between {{ provider }}, and {{ client }}.

    1. SERVICES
    {{ services_description }}

    2. COMPENSATION
    {{ compensation }}

    3. TERM AND TERMINATION
    {{ term_and_termination }}

    4. CONFIDENTIALITY
    {{ confidentiality }}

    SIGNATURES:
    
    {{ provider }}                              {{ client }}
    ___________________                         ___________________
    """,
    
    "privacy_policy": """
    PRIVACY POLICY

    Last Updated: {{ last_updated }}

    1. INTRODUCTION
    {{ introduction }}

    2. INFORMATION WE COLLECT
    {{ information_collected }}

    3. HOW WE USE YOUR INFORMATION
    {{ information_usage }}

    4. DISCLOSURE OF YOUR INFORMATION
    {{ information_disclosure }}

    5. DATA SECURITY
    {{ data_security }}

    6. YOUR RIGHTS
    {{ user_rights }}

    7. CONTACT US
    {{ contact_information }}
    """
}

def generate_document(template_name: str, variables: Dict[str, Any]) -> Tuple[str, str]:
    """
    Generate a document from a template and variables
    
    Returns:
        Tuple[str, str]: (document_id, document_content)
    """
    if template_name not in templates:
        raise ValueError(f"Template {template_name} not found")
    
    # Generate document from template
    template = Template(templates[template_name])
    document = template.render(**variables)
    
    # Create document ID
    doc_id = str(uuid.uuid4())
    
    # Store document in Redis
    doc_data = {
        "content": document,
        "template": template_name,
        "variables": variables,
        "version": 1,
        "created_at": datetime.now().isoformat()
    }
    
    redis_client.set(f"doc:{doc_id}", json.dumps(doc_data))
    logger.info(f"Generated document with ID: {doc_id}")
    
    return doc_id, document

def update_document(doc_id: str, variables: Dict[str, Any]) -> Tuple[str, str, str]:
    """
    Update an existing document with new variables
    
    Returns:
        Tuple[str, str, str]: (document_id, new_content, diff)
    """
    # Get document data from Redis
    doc_data_json = redis_client.get(f"doc:{doc_id}")
    if not doc_data_json:
        raise ValueError(f"Document {doc_id} not found")
    
    doc_data = json.loads(doc_data_json)
    old_content = doc_data["content"]
    template_name = doc_data["template"]
    
    # Update variables
    new_variables = {**doc_data["variables"], **variables}
    
    # Generate new document
    template = Template(templates[template_name])
    new_content = template.render(**new_variables)
    
    # Update document in Redis
    doc_data["content"] = new_content
    doc_data["variables"] = new_variables
    doc_data["version"] += 1
    doc_data["updated_at"] = datetime.now().isoformat()
    
    # Store version history
    redis_client.set(f"doc:{doc_id}:v{doc_data['version']-1}", 
                     json.dumps({"content": old_content}))
    
    # Store current version
    redis_client.set(f"doc:{doc_id}", json.dumps(doc_data))
    
    # Generate diff
    diff = generate_diff(old_content, new_content)
    logger.info(f"Updated document {doc_id} to version {doc_data['version']}")
    
    return doc_id, new_content, diff

def get_document(doc_id: str, version: Optional[int] = None) -> Dict[str, Any]:
    """Get a document by ID, optionally a specific version"""
    key = f"doc:{doc_id}"
    if version is not None:
        key = f"{key}:v{version}"
    
    doc_data_json = redis_client.get(key)
    if not doc_data_json:
        raise ValueError(f"Document {doc_id} (version {version}) not found")
    
    return json.loads(doc_data_json)

def get_document_versions(doc_id: str) -> List[int]:
    """Get all available versions of a document"""
    # Get current version
    doc_data_json = redis_client.get(f"doc:{doc_id}")
    if not doc_data_json:
        raise ValueError(f"Document {doc_id} not found")
    
    doc_data = json.loads(doc_data_json)
    current_version = doc_data.get("version", 1)
    
    # Check previous versions
    versions = [current_version]
    for v in range(1, current_version):
        if redis_client.get(f"doc:{doc_id}:v{v}"):
            versions.append(v)
    
    return sorted(versions)

def generate_diff(old_text: str, new_text: str) -> str:
    """Generate a diff between two texts"""
    diff = difflib.unified_diff(
        old_text.splitlines(keepends=True),
        new_text.splitlines(keepends=True),
        n=3
    )
    return ''.join(diff)

def get_available_templates() -> Dict[str, str]:
    """Get available templates"""
    return {name: template[:100] + "..." for name, template in templates.items()} 