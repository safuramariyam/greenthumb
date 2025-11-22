"""
Model Training Module - FIXED VERSION
utils/training.py
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import numpy as np
from pathlib import Path
from tqdm import tqdm
from datetime import datetime
import json
from typing import Tuple, Dict

class ModelTrainer:
    """
    Handles model training, validation, and checkpointing
    """
    
    def __init__(self, dataset_handler, classifier):
        self.dataset_handler = dataset_handler
        self.classifier = classifier
        self.device = classifier.device
        self.training_history = {
            "epochs": [],
            "train_loss": [],
            "val_loss": [],
            "train_accuracy": [],
            "val_accuracy": []
        }
    
    def train(
        self,
        epochs: int = 50,
        batch_size: int = 16,
        learning_rate: float = 0.001,
        test_split: float = 0.2,
        save_best: bool = True
    ):
        """
        Train the model
        """
        print(f"\n{'='*60}")
        print(f"Training Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}\n")
        
        try:
            # Prepare dataset
            dataset = self.dataset_handler.get_pytorch_dataset()
            
            if len(dataset) == 0:
                raise ValueError("Dataset is empty. Please upload training images first.")
            
            # Split dataset
            val_size = int(len(dataset) * test_split)
            train_size = len(dataset) - val_size
            train_dataset, val_dataset = random_split(
                dataset,
                [train_size, val_size],
                generator=torch.Generator().manual_seed(42)
            )
            
            # Create dataloaders
            train_loader = DataLoader(
                train_dataset,
                batch_size=batch_size,
                shuffle=True,
                num_workers=0,  # Changed from 4 to 0 for Windows compatibility
                pin_memory=False  # Changed from True for Windows
            )
            
            val_loader = DataLoader(
                val_dataset,
                batch_size=batch_size,
                shuffle=False,
                num_workers=0,  # Changed from 4 to 0 for Windows compatibility
                pin_memory=False  # Changed from True for Windows
            )
            
            print(f"Dataset split - Train: {len(train_dataset)}, Val: {len(val_dataset)}")
            print(f"Batch size: {batch_size}")
            print(f"Learning rate: {learning_rate}\n")
            
            # Setup training
            model = self.classifier.model
            model.train()
            
            # Freeze base model layers initially
            for param in model.base.parameters():
                param.requires_grad = False
            
            # Unfreeze last few layers
            for param in list(model.base.parameters())[-20:]:
                param.requires_grad = True
            
            optimizer = optim.Adam(
                filter(lambda p: p.requires_grad, model.parameters()),
                lr=learning_rate
            )
            
            scheduler = optim.lr_scheduler.ReduceLROnPlateau(
                optimizer,
                mode='min',
                factor=0.5,
                patience=5,
                verbose=True
            )
            
            # Loss functions
            crop_loss_fn = nn.CrossEntropyLoss()
            severity_loss_fn = nn.CrossEntropyLoss()
            
            best_val_loss = float('inf')
            
            # Training loop
            for epoch in range(epochs):
                print(f"\nEpoch {epoch+1}/{epochs}")
                print("-" * 60)
                
                # Training phase
                train_loss, train_acc = self._train_epoch(
                    model, train_loader, optimizer,
                    crop_loss_fn, severity_loss_fn
                )
                
                # Validation phase
                val_loss, val_acc = self._validate_epoch(
                    model, val_loader,
                    crop_loss_fn, severity_loss_fn
                )
                
                # Record history
                self.training_history["epochs"].append(epoch + 1)
                self.training_history["train_loss"].append(train_loss)
                self.training_history["val_loss"].append(val_loss)
                self.training_history["train_accuracy"].append(train_acc)
                self.training_history["val_accuracy"].append(val_acc)
                
                print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.4f}")
                print(f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}")
                
                # Learning rate scheduling
                scheduler.step(val_loss)
                
                # Save best model
                if save_best and val_loss < best_val_loss:
                    best_val_loss = val_loss
                    self.classifier.save_model("models/saved/plant_classifier.pth")
                    print("✓ New best model saved!")
                
                # Unfreeze more layers after epoch 10
                if epoch == 10:
                    print("\n🔓 Unfreezing more layers for fine-tuning...")
                    for param in model.base.parameters():
                        param.requires_grad = True
            
            # Save training history
            self._save_training_history()
            
            print(f"\n{'='*60}")
            print(f"Training Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Best Validation Loss: {best_val_loss:.4f}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            print(f"Error during training: {str(e)}")
            raise
    
    def _train_epoch(self, model, dataloader, optimizer, crop_loss_fn, severity_loss_fn) -> Tuple[float, float]:
        """Train for one epoch"""
        model.train()
        total_loss = 0
        correct_predictions = 0
        total_samples = 0
        
        pbar = tqdm(dataloader, desc="Training")
        
        for images, crop_labels, severity_labels in pbar:
            images = images.to(self.device)
            crop_labels = crop_labels.to(self.device)
            severity_labels = severity_labels.to(self.device)
            
            # Forward pass
            crop_logits, severity_logits = model(images)
            
            # Calculate loss
            crop_loss = crop_loss_fn(crop_logits, crop_labels)
            severity_loss = severity_loss_fn(severity_logits, severity_labels)
            total = crop_loss + severity_loss
            
            # Backward pass
            optimizer.zero_grad()
            total.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            
            # Calculate metrics
            total_loss += total.item()
            crop_preds = crop_logits.argmax(dim=1)
            correct_predictions += (crop_preds == crop_labels).sum().item()
            total_samples += crop_labels.size(0)
            
            pbar.set_postfix({"loss": total.item()})
        
        avg_loss = total_loss / len(dataloader)
        accuracy = correct_predictions / total_samples
        
        return avg_loss, accuracy
    
    def _validate_epoch(self, model, dataloader, crop_loss_fn, severity_loss_fn) -> Tuple[float, float]:
        """Validate for one epoch"""
        model.eval()
        total_loss = 0
        correct_predictions = 0
        total_samples = 0
        
        with torch.no_grad():
            for images, crop_labels, severity_labels in tqdm(dataloader, desc="Validating"):
                images = images.to(self.device)
                crop_labels = crop_labels.to(self.device)
                severity_labels = severity_labels.to(self.device)
                
                # Forward pass
                crop_logits, severity_logits = model(images)
                
                # Calculate loss
                crop_loss = crop_loss_fn(crop_logits, crop_labels)
                severity_loss = severity_loss_fn(severity_logits, severity_labels)
                total = crop_loss + severity_loss
                
                # Calculate metrics
                total_loss += total.item()
                crop_preds = crop_logits.argmax(dim=1)
                correct_predictions += (crop_preds == crop_labels).sum().item()
                total_samples += crop_labels.size(0)
        
        avg_loss = total_loss / len(dataloader)
        accuracy = correct_predictions / total_samples
        
        return avg_loss, accuracy
    
    def _save_training_history(self):
        """Save training history to file"""
        history_path = Path("models/training_history.json")
        history_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert numpy arrays to lists for JSON serialization
        history_serializable = {
            k: [float(v) if isinstance(v, (np.floating, np.integer)) else v for v in vals]
            for k, vals in self.training_history.items()
        }
        
        with open(history_path, 'w') as f:
            json.dump(history_serializable, f, indent=2)
        
        print(f"Training history saved to {history_path}")