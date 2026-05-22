import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

const DashboardCard = ({ title, value, icon, subtitle, color = 'primary.main', badgeText, badgeColor }) => {
  return (
    <Card 
      sx={{ 
        minWidth: 200, 
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          borderColor: '#3b82f6',
        }
      }}
    >
      <CardContent sx={{ p: '24px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600, 
              color: '#64748b', 
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '11px' 
            }}
          >
            {title}
          </Typography>
          <Box 
            sx={{ 
              p: 1.5, 
              borderRadius: '8px', 
              backgroundColor: 'rgba(59, 130, 246, 0.08)', 
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700, 
            color: '#0f172a',
            mb: 1,
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {badgeText && (
            <Box 
              sx={{ 
                fontSize: '11px',
                fontWeight: 600,
                px: 1,
                py: 0.25,
                borderRadius: '12px',
                backgroundColor: badgeColor === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: badgeColor === 'error' ? '#ef4444' : '#10b981',
                display: 'inline-block'
              }}
            >
              {badgeText}
            </Box>
          )}
          {subtitle && (
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '12px' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
