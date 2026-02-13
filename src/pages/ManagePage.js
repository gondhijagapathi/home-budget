import * as React from 'react';
import AddCategoryCard from '../features/manage/components/AddCategoryCard';
import AddSubCategoryCard from '../features/manage/components/AddSubCategoryCard';
import CategoryListCard from '../features/manage/components/CategoryListCard';
import SubCategoryListCard from '../features/manage/components/SubCategoryListCard';
import AddIncomeSourceCard from '../features/manage/components/AddIncomeSourceCard';
import IncomeSourceListCard from '../features/manage/components/IncomeSourceListCard';
import BackupRestoreCard from '../features/manage/components/BackupRestoreCard';
import GeminiUsageStats from '../features/manage/components/GeminiUsageStats';


function EditDatabase() {
    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {/* Add Category */}
                <AddCategoryCard />

                {/* Add Subcategory */}
                <AddSubCategoryCard />

                {/* Add Income Source */}
                <AddIncomeSourceCard />

                {/* View & Edit Categories */}
                <CategoryListCard />

                {/* View & Edit Subcategories */}
                <SubCategoryListCard />

                {/* View & Edit Income Sources */}
                <IncomeSourceListCard />
            </div>

            {/* Backup & Restore - Full width independent card */}
            <div className="w-full">
                <BackupRestoreCard />
            </div>

            {/* Gemini Usage Utils */}
            <div className="w-full">
                <GeminiUsageStats />
            </div>



        </div >
    );
}

export default EditDatabase;