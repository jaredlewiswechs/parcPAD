"""Newton cartridges — domain-specific verification and generation modules."""
from newton.cartridges.base import Cartridge
from newton.cartridges.visual import VisualCartridge
from newton.cartridges.sound import SoundCartridge
from newton.cartridges.sequence import SequenceCartridge
from newton.cartridges.data import DataCartridge
from newton.cartridges.rosetta import RosettaCartridge

__all__ = [
    "Cartridge",
    "VisualCartridge",
    "SoundCartridge",
    "SequenceCartridge",
    "DataCartridge",
    "RosettaCartridge",
]
