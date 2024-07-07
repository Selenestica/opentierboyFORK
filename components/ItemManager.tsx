import React, {useMemo, useState} from 'react';
import {Button, buttonVariants} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {toast} from "sonner";
import ItemCreator from "@/components/ItemCreator";
import ItemSetSelector from "@/components/ItemSetSelector";
import {GridIcon} from "@radix-ui/react-icons";
import {cn} from "@/lib/utils";
import Item from "@/models/Item";
import imagesetConfig from "@/imageset.config.json";
import {ItemSet} from "@/models/ItemSet";

interface ItemManagerProps {
  onItemsCreate: (newItems: Item[]) => void;
  onUndoItemsCreate: (itemIds: string[]) => void;
  resetItems: () => void;
  deleteAllItems: () => void;
  undoReset: () => void;
  undoDelete: () => void;
}

interface ImagesetConfig {
  packages: {
    [key: string]: {
      displayName: string;
      images: {
        filename: string;
        label: string;
        tags: string[];
      }[];
      tags: {
        [key: string]: {
          title: string;
          description: string;
          category: string;
        };
      };
    };
  };
}

// Assert the type of imagesetConfig
const typedImagesetConfig = imagesetConfig as ImagesetConfig;

const ItemManager: React.FC<ItemManagerProps> = ({
  onItemsCreate,
  onUndoItemsCreate,
  resetItems,
  deleteAllItems,
  undoReset,
  undoDelete,
}) => {
  const [isItemCreatorOpen, setIsItemCreatorOpen] = useState(false);

  const itemSets = useMemo(() => {
    const sets: ItemSet[] = [];

    Object.entries(typedImagesetConfig.packages).forEach(([packageName, packageData]) => {
      const packageDisplayName = packageData.displayName;

      // Add an "All Items" set for each package
      sets.push({
        packageName,
        packageDisplayName,
        tagName: 'all',
        tagTitle: 'All Items',
        images: packageData.images.map(img => img.filename)
      });

      // Add a set for each tag in the package
      Object.entries(packageData.tags).forEach(([tagName, tagData]) => {
        const taggedImages = packageData.images.filter(image => image.tags.includes(tagName));

        if (taggedImages.length > 0) {
          sets.push({
            packageName,
            packageDisplayName,
            tagName,
            tagTitle: tagData.title,
            images: taggedImages.map(img => img.filename)
          });
        }
      });
    });

    return sets;
  }, []);

  const handleCreateItems = (newItems: Item[]) => {
    onItemsCreate(newItems);
    setIsItemCreatorOpen(false);
    toast('Items Added', {
      description: `${newItems.length} item(s) have been added.`,
      action: {
        label: 'Undo',
        onClick: () => onUndoItemsCreate(newItems.map(item => item.id)),
      },
    });
  };

  const handleReset = () => {
    resetItems();
    toast('Items Reset', {
      description: 'All item rankings have been reset.',
      action: {
        label: 'Undo',
        onClick: undoReset,
      },
    });
  };

  const handleDelete = () => {
    deleteAllItems();
    toast('All Items Deleted', {
      description: 'All items have been removed.',
      action: {
        label: 'Undo',
        onClick: undoDelete,
      },
    });
  };

  const handleItemSetSelect = (packageName: string, tagName: string, images: string[]) => {
    const packageData = typedImagesetConfig.packages[packageName];
    const newItems = images.map((image: string, index: number) => {
      const imageData = packageData.images.find(img => img.filename === image);
      return {
        id: `${packageName}-${tagName}-item-${index}`,
        content: imageData?.label || `${image.split('.')[0]}`,
        imageUrl: `/images/${packageName}/${image}`,
        tags: imageData?.tags || []
      };
    });
    handleCreateItems(newItems);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <GridIcon className="h-4 w-4"/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Add Items</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>From template</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <ItemSetSelector itemSets={itemSets} onSelectItemSet={handleItemSetSelect}/>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => setIsItemCreatorOpen(true)}>
            From your device
          </DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem onSelect={handleReset}>Reset</DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}
                                className="dark:focus:bg-destructive dark:focus:text-primary focus:text-destructive"
              >
                Remove All
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all items from all tiers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className={cn(buttonVariants({variant: "destructive"}))}>
                  Remove All Items
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isItemCreatorOpen} onOpenChange={setIsItemCreatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Items</DialogTitle>
            <DialogDescription>
              Add your images to create new items. Edit names if needed.
            </DialogDescription>
          </DialogHeader>
          <ItemCreator
            onItemsCreate={handleCreateItems}
            onUndoItemsCreate={onUndoItemsCreate}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemManager;