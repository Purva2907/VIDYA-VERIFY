"""add_verification_history

Revision ID: ee0561be2dd0
Revises: 77f340ce2ad3
Create Date: 2026-10-21 16:40:44.752766

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee0561be2dd0'
down_revision: Union[str, Sequence[str], None] = '77f340ce2ad3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include persistent verification_history table."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if 'verification_history' not in tables:
        op.create_table(
            'verification_history',
            sa.Column('id', sa.String(length=64), nullable=False),
            sa.Column('apaar_id', sa.String(length=64), nullable=False),
            sa.Column('apaar_id_masked', sa.String(length=64), nullable=False),
            sa.Column('status', sa.String(length=32), nullable=False),
            sa.Column('source_type', sa.String(length=64), nullable=False),
            sa.Column('is_sandbox', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('institution_code', sa.String(length=64), nullable=True),
            sa.Column('institution_name', sa.String(length=255), nullable=True),
            sa.Column('programme', sa.String(length=255), nullable=True),
            sa.Column('actor_email', sa.String(length=255), nullable=True),
            sa.Column('actor_role', sa.String(length=64), nullable=True),
            sa.Column('actor_institution', sa.String(length=64), nullable=True),
            sa.Column('session_id', sa.String(length=64), nullable=True),
            sa.Column('timestamp', sa.String(length=32), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_verification_history_status'), 'verification_history', ['status'], unique=False)
        op.create_index(op.f('ix_verification_history_institution_code'), 'verification_history', ['institution_code'], unique=False)
        op.create_index(op.f('ix_verification_history_actor_institution'), 'verification_history', ['actor_institution'], unique=False)
        op.create_index(op.f('ix_verification_history_session_id'), 'verification_history', ['session_id'], unique=False)
        op.create_index(op.f('ix_verification_history_timestamp'), 'verification_history', ['timestamp'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_verification_history_timestamp'), table_name='verification_history')
    op.drop_index(op.f('ix_verification_history_session_id'), table_name='verification_history')
    op.drop_index(op.f('ix_verification_history_actor_institution'), table_name='verification_history')
    op.drop_index(op.f('ix_verification_history_institution_code'), table_name='verification_history')
    op.drop_index(op.f('ix_verification_history_status'), table_name='verification_history')
    op.drop_table('verification_history')

