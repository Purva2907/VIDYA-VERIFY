"""add_institution_intakes

Revision ID: 77f340ce2ad3
Revises: 66e239bd1fc2
Create Date: 2026-10-20 16:47:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '77f340ce2ad3'
down_revision: Union[str, Sequence[str], None] = '66e239bd1fc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to include session-specific institution intakes."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()
    if 'institution_intakes' not in tables:
        op.create_table(
            'institution_intakes',
            sa.Column('id', sa.String(length=64), nullable=False),
            sa.Column('institution_code', sa.String(length=64), nullable=False),
            sa.Column('academic_session', sa.String(length=32), nullable=False),
            sa.Column('sanctioned_intake', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.String(length=32), nullable=False),
            sa.Column('updated_at', sa.String(length=32), nullable=True),
            sa.ForeignKeyConstraint(['institution_code'], ['institutions.code'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('institution_code', 'academic_session', name='uq_institution_intake_session')
        )
        op.create_index(op.f('ix_institution_intakes_institution_code'), 'institution_intakes', ['institution_code'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_institution_intakes_institution_code'), table_name='institution_intakes')
    op.drop_table('institution_intakes')
