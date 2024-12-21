import React from 'react';
import styles from './Skeleton.module.css';

const Skeleton = () => {
    return (
        <div className={styles.skeletonContainer}>
            <div className={styles.header}>
                <div className={styles.titleSkeleton} />
            </div>
            
            <div className={styles.formGrid}>
                <div className={styles.descriptionColumn}>
                    <div className={styles.formGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.textAreaSkeleton} />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.chatSelectorSkeleton}>
                            <div className={styles.chatItemSkeleton} />
                            <div className={styles.chatItemSkeleton} />
                            <div className={styles.chatItemSkeleton} />
                        </div>
                    </div>
                </div>
                
                <div className={styles.settingsColumn}>
                    <div className={styles.formGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.datePickerSkeleton} />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.repeatSettingsSkeleton}>
                            <div className={styles.repeatOptionSkeleton} />
                            <div className={styles.repeatOptionSkeleton} />
                            <div className={styles.repeatOptionSkeleton} />
                        </div>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <div className={styles.labelSkeleton} />
                        <div className={styles.notificationsSkeleton}>
                            <div className={styles.notificationItemSkeleton} />
                            <div className={styles.notificationItemSkeleton} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Skeleton; 