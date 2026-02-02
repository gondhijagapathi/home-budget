import * as React from 'react';
import AddCategoryCard from './components/AddCategoryCard';
import AddSubCategoryCard from './components/AddSubCategoryCard';
import CategoryListCard from './components/CategoryListCard';
import SubCategoryListCard from './components/SubCategoryListCard';

function EditDatabase() {
    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            {/* Add Category */}
            <AddCategoryCard />

            {/* Add Subcategory */}
            <AddSubCategoryCard />

            {/* View & Edit Categories */}
            <CategoryListCard />

            {/* View & Edit Subcategories */}
            <SubCategoryListCard />
        </div>
    );
}

export default EditDatabase;